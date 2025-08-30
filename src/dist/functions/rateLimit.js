// Rate limiting for better user experience
const userRequests = new Map();
const RATE_LIMIT_PER_MINUTE = 10;
// Helper function to check rate limit
export function checkRateLimit(userId) {
    const now = Date.now();
    const userData = userRequests.get(userId) || { count: 0, resetTime: now + 60000 };
    if (now > userData.resetTime) {
        userData.count = 1;
        userData.resetTime = now + 60000;
    }
    else if (userData.count >= RATE_LIMIT_PER_MINUTE) {
        return false;
    }
    else {
        userData.count++;
    }
    userRequests.set(userId, userData);
    return true;
}
