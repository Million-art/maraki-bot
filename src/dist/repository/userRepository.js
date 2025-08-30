import User from "../models/user.js";
export const createUser = async (data) => {
    return await User.create(data);
};
export const getUserById = async (userId) => {
    return await User.findOne({ userId });
};
export const updateReferral = async (referrerId, referredUserId) => {
    return await User.findOneAndUpdate({ userId: referrerId }, {
        $inc: { "referral.count": 1 },
        $push: { "referral.users": referredUserId },
        updatedAt: new Date(),
    }, { new: true });
};
