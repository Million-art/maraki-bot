import Conversation from '../models/conversation.js';
import { Document } from 'mongoose';

export interface ConversationDoc extends Document {
  userId: number;
  conversations: {
    input: string;
    response: string;
    lessonType: string;
    mistakes: string[];
    timestamp?: Date;
  }[];
  commonMistakes: string[];
  currentLesson?: string;
  lastActive: Date;
}

function extractLessonTopic(userInput: string, botResponse: string): string {
  const topics: Record<string, string[]> = {
    'past tense': ['goed', 'went', 'have went', 'have gone', 'did', 'done'],
    'past perfect': ['had gone', 'had done', 'had seen'],
    'future simple': ['will go', 'will do', 'will see'],
    'present continuous': ['am go', 'am going', 'is go', 'is going'],
    'present perfect': ['have gone', 'has gone', 'have seen', 'has seen'],
    'articles': ['a', 'an', 'the'],
    'subject-verb agreement': ['I is', 'he are', 'they is'],
    'prepositions': ['in', 'on', 'at', 'to', 'for'],
    'modals': ['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'],
    'conditionals': ['if '],
    'reported speech': ['said that', 'told me that', 'asked if'],
    'passive voice': ['is done', 'was done', 'are done', 'were done', 'be done'],
    'relative clauses': ['who', 'whom', 'whose', 'which', 'that where'],
    'gerunds and infinitives': ['to do', 'doing', 'to go', 'going'],
    'comparatives and superlatives': ['-er than', 'more than', 'the -est', 'the most']
  };

  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
      return topic;
    }
  }
  return 'general grammar';
}

const MAX_MEMORY_ITEMS = 10;

export async function updateUserHistory(
  userId: number,
  userInput: string,
  botResponse: string,
  lessonType: string,
  identifiedMistakes?: string[]
) {
  try {
    let conversation = (await Conversation.findOne({ userId })) as unknown as ConversationDoc | null;

    if (!conversation) {
      conversation = new Conversation({
        userId,
        conversations: [],
        commonMistakes: [],
        lastActive: new Date(),
      }) as unknown as ConversationDoc;
    }

    // Add new conversation entry
    conversation.conversations.push({
      input: userInput,
      response: botResponse,
      lessonType,
      mistakes: identifiedMistakes || [],
      timestamp: new Date()
    });

    // Update common mistakes
    (identifiedMistakes || []).forEach(mistake => {
      if (!conversation.commonMistakes.includes(mistake)) {
        conversation.commonMistakes.push(mistake);
      }
    });

    // Keep only last MAX_MEMORY_ITEMS conversations
    if (conversation.conversations.length > MAX_MEMORY_ITEMS) {
      conversation.conversations = conversation.conversations.slice(-MAX_MEMORY_ITEMS);
    }

    // Update current lesson if it's a grammar correction
    if (lessonType === 'grammar_correction') {
      conversation.currentLesson = extractLessonTopic(userInput, botResponse);
    }

    // Update last active timestamp
    conversation.lastActive = new Date();

    await conversation.save();
  } catch (error) {
    console.error('Error updating user history:', error);
  }
}
