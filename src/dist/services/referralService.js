import { createUser, getUserById, updateReferral } from "../repository/userRepository.js";
export const registerUser = async (userData, referralCode) => {
    let user = await getUserById(userData.userId);
    if (!user) {
        user = await createUser(userData);
        if (referralCode) {
            const referrerId = parseInt(referralCode, 10);
            await updateReferral(referrerId, user.userId);
            user.referredBy = referrerId;
            await user.save();
        }
    }
    return user;
};
export const generateReferralLink = (userId) => {
    return `https://t.me/marakiai_bot?start=ref${userId}`;
};
