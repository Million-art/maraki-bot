// src/helpers/processGrammarText.ts
import grammarPrompt from "../guide/grammarPrompt.js";
import { levelInstructions } from "../guide/levelInstruction.js";
import { checkRateLimit } from "./rateLimit.js";
import validateInput from "./validateInput.js";
import { callGeminiGenerateContent } from "../api/gemini/callGeminiGenerateContents.js";
import formatResponse from "./formatResponse.js";
import Conversation from "../models/conversation.js";
import { Context } from "telegraf";

// Define AI response type
interface AIResponse {
  correctedText: string;
  explanation: string;
  grammarType: string;
}

/**
 * Convert AI markdown-like formatting into Telegram HTML parse_mode
 */
function formatForTelegram(text: string): string {
  return text
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")     // strikethrough
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>") // bold
    .replace(/\*([^*]+)\*/g, "<i>$1</i>")     // italic
    .replace(/__([^_]+)__/g, "<u>$1</u>")     // underline
    .replace(/`([^`]+)`/g, "<code>$1</code>"); // inline code
}

/**
 * Clean AI response by removing ```json blocks
 */
function cleanAIResponse(raw: string): string {
  return raw.trim()
            .replace(/^```json\s*/, "")
            .replace(/```$/, "")
            .trim();
}

/**
 * Handles user grammar correction requests
 */
async function processGrammarText(
  ctx: Context,
  userText: string,
  userId: number
) {
  await ctx.sendChatAction("typing");

  // Validate input
  const validation = validateInput(userText);
  if (!validation.valid) {
    await ctx.reply(formatResponse(validation.error, "warning"));
    return;
  }

  // Rate limit check
  if (!checkRateLimit(userId)) {
    await ctx.reply(
      formatResponse(
        "You've reached the rate limit. Please wait a minute before sending another message.",
        "warning"
      )
    );
    return;
  }

  try {
    // Retrieve conversation
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = await Conversation.create({ userId });
    }

    // Extract user info if they introduced themselves earlier
    let userInfo = "";
    if (conversation.grammar.length > 0) {
      const namePatterns = conversation.grammar
        .filter(
          (conv: any) =>
            conv.input.toLowerCase().includes("my name is") ||
            conv.input.toLowerCase().includes("i am")
        )
        .map((conv: any) => conv.input);

      if (namePatterns.length > 0) {
        const lastNameIntro = namePatterns[namePatterns.length - 1];
        const nameMatch = lastNameIntro.match(
          /(?:my name is|i am)\s+([a-zA-Z]+)/i
        );
        if (nameMatch) userInfo = `User's name: ${nameMatch[1]}. `;
      }
    }

    // User level (default beginner)
    const userLevel = conversation.userLevel || "beginner";

    // Conversation context (last 10 grammar messages)
    const contextText =
      conversation.grammar.length > 0
        ? `=== GRAMMAR HISTORY (READ CAREFULLY) ===
${userInfo}Recent grammar messages:
${conversation.grammar
  .slice(-10)
  .map(
    (c: any, i: number) =>
      `${i + 1}. User: "${c.input}" → Bot: "${c.response}"`
  )
  .join("\n")}
Current context: The user is learning about "Grammar Correction".
User Level: ${userLevel.toUpperCase()}
=== END GRAMMAR HISTORY ===`
        : userInfo
        ? `CONTEXT: ${userInfo}`
        : "";

    // Build prompt
    const prmt = `${grammarPrompt}
${levelInstructions[userLevel]}

${contextText}

User text: "${userText}"`;

    // Call AI
    const aiTextRaw = await callGeminiGenerateContent(prmt);
    console.log("AI Response:", aiTextRaw);

    // Clean and parse AI response
    const cleanedText = cleanAIResponse(aiTextRaw);
    let aiJson: AIResponse;
    try {
      aiJson = JSON.parse(cleanedText) as AIResponse;
    } catch (err) {
      console.error("Invalid AI JSON:", err, cleanedText);
      await ctx.reply(
        formatResponse("❌ Invalid AI response. Please try again.", "error")
      );
      return;
    }

    // Format AI response for Telegram
    const formattedText = `
<b>${formatForTelegram(aiJson.correctedText)}</b>
Explanation: ${formatForTelegram(aiJson.explanation)}
`.trim();

    // Save conversation update
    await Conversation.findOneAndUpdate(
      { userId },
      {
        $set: {
          currentLesson: "Grammar Correction",
          lastActive: new Date(),
        },
        $push: {
          grammar: { input: userText, response: formattedText, grammarType: aiJson.grammarType },
        },
      },
      { new: true, upsert: true }
    );

    // Reply to user
    await ctx.reply(formattedText, { parse_mode: "HTML" });
  } catch (err: any) {
    console.error("Bot error:", err);
    const errorMessage = err.message?.includes("API")
      ? "I'm having trouble connecting to my AI service right now. Please try again in a few minutes."
      : "Something went wrong while processing your request. Please try again.";
    await ctx.reply(formatResponse(errorMessage, "error"));
  }
}

export default processGrammarText;
