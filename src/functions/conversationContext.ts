import Conversation from "../models/conversation.js";

// Get the full conversation for a user
export async function getConversationContext(userId: number) {
  return await Conversation.findOne({ userId });
}

// Set or replace the conversation context for a user
export async function setConversationContext(userId: number, context: any) {
  return await Conversation.findOneAndUpdate(
    { userId },
    { $set: context },
    { upsert: true, new: true }
  );
}

// Update specific fields of the conversation (e.g., push new grammar/lesson, change level)
export async function updateConversationContext(userId: number, updates: any) {
  return await Conversation.findOneAndUpdate(
    { userId },
    updates,
    { new: true, upsert: true }
  );
}
