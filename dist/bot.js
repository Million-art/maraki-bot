import { Markup, Telegraf } from "telegraf";
import fetch from "node-fetch";
import dotenv from "dotenv";
import express from "express";
import { getConversationContext, updateConversationContext } from './functions/conversationContext.js';
import processGrammarText from "./functions/processGrammarText.js";
import welcomeMessageLesson from "./guide/wellcomeMessageLesson.js";
import { generateReferralLink, registerUser } from "./services/referralService.js";
import welcomeMessageGrammar from "./guide/welcomeMessageGrammar.js";
import helpMessage from "./guide/helpMessage.js";
import welcomeMessage from "./guide/startMessage.js";
import processLessonText from "./functions/processLessonText.js";
import processQuizText from "./functions/processQuizText.js";
import { message } from "telegraf/filters";
import formatResponse from "./functions/formatResponse.js";
import { connectDB } from "./config/dbconfig.js";
dotenv.config();
connectDB();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = process.env.PORT || 3000;
// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Maraki AI is running!',
        timestamp: new Date().toISOString()
    });
});
// Validate env
if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is required in .env file");
    process.exit(1);
}
if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is required in .env file");
    process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);
// In-memory user states
const userStates = new Map();
// Start command
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const referralCode = ctx.payload?.replace("ref", "") || null;
    const userData = {
        userId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
    };
    try {
        const user = await registerUser(userData, referralCode);
        const refLink = generateReferralLink(user.userId);
        userStates.delete(userId);
        await ctx.reply(welcomeMessage);
    }
    catch (err) {
        console.error("Error registering user:", err);
        await ctx.reply("⚠️ Unable to register. Please try again later.");
    }
});
// Help command
bot.help(async (ctx) => {
    await ctx.reply(helpMessage);
});
// Grammar command
bot.command('grammar', async (ctx) => {
    const userId = ctx.from.id;
    userStates.set(userId, 'grammar');
    await ctx.reply(welcomeMessageGrammar);
});
// Lesson command
bot.command('lesson', async (ctx) => {
    const userId = ctx.from.id;
    userStates.set(userId, 'lesson');
    await ctx.reply(welcomeMessageLesson);
});
// Level command
bot.command('level', async (ctx) => {
    const userId = ctx.from.id;
    const context = await getConversationContext(userId);
    const currentLevel = context?.userLevel || 'beginner';
    await ctx.reply(`Your current level is: ${currentLevel}  
Please choose your preferred English difficulty level from the options below:`, Markup.inlineKeyboard([
        [Markup.button.callback("🟢 Beginner", "level_beginner")],
        [Markup.button.callback("🟡 Intermediate", "level_intermediate")],
        [Markup.button.callback("🔴 Advanced", "level_advanced")],
        [Markup.button.callback("⏭️ Skip", "skip_level")]
    ]));
});
// Handle level selection
bot.action(/level_(.+)/, async (ctx) => {
    const selectedLevel = ctx.match[1];
    const userId = ctx.from.id;
    await updateConversationContext(userId, { userLevel: selectedLevel });
    await ctx.answerCbQuery(`Level set to ${selectedLevel}`);
    await ctx.editMessageText(`Your English level has been set to: ${selectedLevel}`);
});
// Handle normal messages
bot.on(message('text'), async (ctx) => {
    const userId = ctx.from.id;
    const userText = ctx.message.text;
    const userState = userStates.get(userId);
    switch (userState) {
        case 'grammar':
            await processGrammarText(ctx, userText, userId);
            break;
        case 'lesson':
            await processLessonText(ctx, userText, userId);
            break;
        case 'quiz':
            await processQuizText(ctx, userText, userId);
            break;
        default:
            if (!userText.startsWith('/')) {
                await ctx.reply("ℹ️ Use /lesson to start lesson mode or /grammar to start grammar checking mode.");
            }
            break;
    }
});
// Bot error handling
bot.catch((err, ctx) => {
    console.error("Bot error:", err);
    ctx.reply(formatResponse("An unexpected error occurred. Please try again later.", 'error'));
});
// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
// Start Express and launch bot
app.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
    bot.launch().then(() => {
        console.log("🚀 Bot launched successfully!");
        if (process.env.RENDER) {
            setInterval(async () => {
                try {
                    const url = `https://${process.env.RENDER_EXTERNAL_URL}/ping`;
                    const res = await fetch(url);
                    if (res.ok)
                        console.log("✅ Keep-alive ping successful");
                }
                catch (err) {
                    console.warn("⚠️ Keep-alive ping failed:", err.message);
                }
            }, 10 * 60 * 1000);
        }
    }).catch(err => {
        console.error("❌ Failed to launch bot:", err);
        process.exit(1);
    });
});
