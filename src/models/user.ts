import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    },
    username: {
    type: String,
    required: false,
    default: null,
    },
    firstName: {
    type: String,
    required: false,
    default: null,
    },  
    lastName: {
    type: String,
    required: false,
    default: null,
    },
    referredBy:{
    type: Number,
    required: false,
    default: null,
    },
    referral:{
        type: Object,
        default: { count: 0, users: [] },
        
    },
    createdAt: {
    type: Date,
    default: Date.now,
    },
    updatedAt: {
    type: Date,
    default: Date.now,
    },
});

export default mongoose.model("User", userSchema);