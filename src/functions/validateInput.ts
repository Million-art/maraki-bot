// Helper function to validate input
function validateInput(text:string) {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Please provide some text to process." };
  }
  
  if (text.length > 1000) {
    return { valid: false, error: "Text is too long. Please keep it under 1000 characters." };
  }
  
  
  
  return { valid: true };
}
export default validateInput;