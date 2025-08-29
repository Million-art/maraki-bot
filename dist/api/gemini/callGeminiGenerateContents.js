// import { GoogleGenAI } from "@google/genai";
// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
//   serviceAccountKey: process.env.GEMINI_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GEMINI_SERVICE_ACCOUNT_KEY) : undefined,
// });
// export async function callGeminiGenerateContent(promptText) {
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-2.0-flash-001",
//       contents: promptText,
//     });
//     //falbasck to rust api request 
//     // SDK gives you `.text` directly 🎉
//     return response.text.trim();
//   } catch (err) {
//     console.error("Error calling Gemini API:", err);
//     return "An error occurred while generating content. Please try again later.";
//   }
// }
export async function callGeminiGenerateContent(promptText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error("GEMINI_API_KEY is not set");
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: promptText }],
                    },
                ],
            }),
        });
        const data = await response.json();
        // Extract text safely
        return (data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "No response from Gemini.");
    }
    catch (err) {
        console.error("Error calling Gemini API:", err);
        return "An error occurred while generating content. Please try again later.";
    }
}
