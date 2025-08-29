import grammarPrompt from "../guide/grammarPrompt.js";
import { levelInstructions } from "../guide/levelInstruction.js";
import { checkRateLimit } from "./rateLimit.js";
import validateInput from "./validateInput.js";
import { callGeminiGenerateContent } from "../api/gemini/callGeminiGenerateContents.js";
import formatResponse from "./formatResponse.js";
import Conversation from "../models/conversation.js";  
import { Context } from "telegraf";

// Function to process grammar text
async function processGrammarText(ctx: Context, userText:string, userId:number) {
  await ctx.sendChatAction("typing");

  // Validate input
  const validation = validateInput(userText);
  if (!validation.valid) {
    await ctx.reply(formatResponse(validation.error, "warning"));
    return;
  }

  // Check rate limit
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
    // Retrieve the user's conversation
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = await Conversation.create({ userId });
    }

    // Extract user info from previous grammar messages if any
    let userInfo = "";
    if (conversation.grammar.length > 0) {
      const namePatterns = conversation.grammar
        .filter(conv => conv.input.toLowerCase().includes("my name is") || conv.input.toLowerCase().includes("i am"))
        .map(conv => conv.input);

      if (namePatterns.length > 0) {
        const lastNameIntro = namePatterns[namePatterns.length - 1];
        const nameMatch = lastNameIntro.match(/(?:my name is|i am)\s+([a-zA-Z]+)/i);
        if (nameMatch) userInfo = `User's name: ${nameMatch[1]}. `;
      }
    }

    // Get user level
    const userLevel = conversation.userLevel || "beginner";

    // Use last 10 grammar messages for context
    const contextText = conversation.grammar.length > 0
      ? `=== GRAMMAR HISTORY (READ CAREFULLY) ===
${userInfo}Recent grammar messages:
${conversation.grammar.slice(-10).map((c, i) => `${i + 1}. User: "${c.input}" → Bot: "${c.response}"`).join("\n")}
Current context: The user is learning about "Grammar Correction".
User Level: ${userLevel.toUpperCase()}
=== END GRAMMAR HISTORY ===`
      : userInfo ? `CONTEXT: ${userInfo}` : "";

    // Build prompt for AI
    const prmt = `${grammarPrompt}
${levelInstructions[userLevel]}

${contextText}

User text: "${userText}"`;

    const aiText = await callGeminiGenerateContent(prmt);

    // Convert markdown to HTML for Telegram
    const formattedText = aiText
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

    // Update conversation in DB
    await Conversation.findOneAndUpdate(
      { userId },
      {
        $set: { currentLesson: "Grammar Correction", lastActive: new Date() },
        $push: { grammar: { input: userText, response: formattedText } },
      },
      { new: true, upsert: true }
    );

    await ctx.reply(formattedText, { parse_mode: "HTML" });
  } catch (err:any) {
    console.error("Bot error:", err);
    const errorMessage = err.message.includes("API")
      ? "I'm having trouble connecting to my AI service right now. Please try again in a few minutes."
      : "Something went wrong while processing your request. Please try again.";
    await ctx.reply(formatResponse(errorMessage, "error"));
  }
}

export default processGrammarText;
