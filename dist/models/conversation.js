import mongoose from 'mongoose';
import { grammarTypeEnum, lessonTypeEnum } from '../shared/enums.js';
const conversationSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        unique: true,
    },
    grammar: [
        {
            input: {
                type: String,
                required: true,
            },
            response: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            grammarType: {
                type: String,
                enum: grammarTypeEnum,
                default: 'other',
            },
            mistakes: {
                type: [String],
                default: [],
            },
        },
    ],
    lesson: [
        {
            input: {
                type: String,
                required: true,
            },
            response: {
                type: String,
                required: true,
            },
            topic: {
                type: String,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            lessonType: {
                type: String,
                enum: lessonTypeEnum,
                default: 'other',
            },
        },
    ],
    userLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
});
const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
