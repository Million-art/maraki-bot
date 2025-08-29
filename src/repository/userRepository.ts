import User from "../models/user.js";

export const createUser = async (data:any) => {
  return await User.create(data);
};

export const getUserById = async (userId: number) => {
  return await User.findOne({ userId });
};

export const updateReferral = async (referrerId: number, referredUserId: number) => {
  return await User.findOneAndUpdate(
    { userId: referrerId },
    {
      $inc: { "referral.count": 1 },
      $push: { "referral.users": referredUserId },
      updatedAt: new Date(),
    },
    { new: true }
  );
};
