// Helper function to format responses consistently
function formatResponse(text, type = 'info') {
    const emojis = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    };
    return `${emojis[type]} ${text}`;
}
export default formatResponse;
