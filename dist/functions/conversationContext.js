import Conversation from "../models/conversation.js";
// Get the full conversation for a user
export async function getConversationContext(userId) {
    return await Conversation.findOne({ userId });
}
// Set or replace the conversation context for a user
export async function setConversationContext(userId, context) {
    return await Conversation.findOneAndUpdate({ userId }, { $set: context }, { upsert: true, new: true });
}
// Update specific fields of the conversation (e.g., push new grammar/lesson, change level)
export async function updateConversationContext(userId, updates) {
    return await Conversation.findOneAndUpdate({ userId }, updates, { new: true, upsert: true });
}
