import { checkRateLimit } from "./rateLimit.js";
import validateInput from "./validateInput.js";
import { levelInstructions } from "../guide/levelInstruction.js";
import lessonPrompt from "../guide/lessonPrompt.js";
import { callGeminiGenerateContent } from "../api/gemini/callGeminiGenerateContents.js";
import formatResponse from "./formatResponse.js";
import Conversation from "../models/conversation.js";
// Main function
async function processLessonText(ctx, userText, userId) {
    await ctx.sendChatAction("typing");
    // Validate input
    const validation = validateInput(userText);
    if (!validation.valid) {
        await ctx.reply(formatResponse(validation.error, "warning"));
        return;
    }
    // Check rate limit
    if (!checkRateLimit(userId)) {
        await ctx.reply(formatResponse("You've reached the rate limit. Please wait a minute before sending another message.", "warning"));
        return;
    }
    try {
        // Retrieve or create conversation
        let conversation = await Conversation.findOne({ userId });
        if (!conversation) {
            conversation = await Conversation.create({ userId });
        }
        const userLevel = conversation.userLevel || "beginner";
        // Build context text from last 10 lessons
        const contextText = conversation.lesson.length > 0
            ? `=== LESSON HISTORY (READ CAREFULLY) ===
Recent lesson interactions:
${conversation.lesson
                .slice(-10)
                .map((c, i) => `${i + 1}. User: "${c.input}" → Bot: "${c.response}"`)
                .join("\n")}
Current context: The user is learning about "${conversation.currentLesson || "General Lesson"}".
User Level: ${userLevel.toUpperCase()}
=== END LESSON HISTORY ===`
            : "";
        // Build AI prompt
        const aiPrompt = `
${lessonPrompt}
${levelInstructions[userLevel]}

${contextText}

User text: "${userText}"
`;
        // Call Gemini API
        const lessonResponse = await callGeminiGenerateContent(aiPrompt);
        // Format response for Telegram
        const formattedLesson = lessonResponse
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            .replace(/\*(.*?)\*/g, "<i>$1</i>")
            .replace(/\*/g, "");
        // Update conversation in DB
        await Conversation.findOneAndUpdate({ userId }, {
            $set: { currentLesson: `Lesson for ${userLevel}`, lastActive: new Date() },
            $push: { lesson: { input: userText, response: formattedLesson } },
        }, { new: true, upsert: true });
        await ctx.reply(formattedLesson, { parse_mode: "HTML" });
    }
    catch (err) {
        console.error("Error generating lesson:", err);
        const errorMessage = err.message.includes("API")
            ? "I'm having trouble connecting to the AI service. Please try again later."
            : "An error occurred while generating your lesson. Please try again.";
        await ctx.reply(errorMessage);
    }
}
export default processLessonText;
