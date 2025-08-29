
// Helper function to format responses consistently
function formatResponse(text:any, type = 'info') {
  const emojis = {
    'success': '✅',
    'error': '❌',
    'info': 'ℹ️',
    'warning': '⚠️'
  } as Record<string, string>;
  
  return `${emojis[type]} ${text}`;
}

export default formatResponse;