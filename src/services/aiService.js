import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";

export const generateNoteFromContent = async ({ text, file, command }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const contents = [];
  let extractedText = text ? String(text) : "";

  if (file) {
    const isDocx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname?.endsWith(".docx");

    const isTextFile =
      file.mimetype?.startsWith("text/") ||
      file.originalname?.endsWith(".txt") ||
      file.originalname?.endsWith(".md") ||
      file.originalname?.endsWith(".csv");

    if (isDocx) {
      const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = extractedText
        ? `${extractedText}\n\n${docxResult.value}`
        : docxResult.value;
    } else if (isTextFile) {
      const fileText = file.buffer.toString("utf-8");
      extractedText = extractedText
        ? `${extractedText}\n\n${fileText}`
        : fileText;
    } else {
      contents.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64"),
        },
      });
    }
  }

  const userInstruction = command?.trim() || "Convert the content into clear, well-structured, and comprehensive notes.";

  const prompt = `You are an expert note-taking assistant.
User Instruction: ${userInstruction}

${extractedText ? `Content:\n${extractedText}\n` : ""}

Analyze the provided input and transform it into high-quality notes following the user's instructions.
Output ONLY a valid JSON object with the following structure:
{
  "title": "A concise and informative note title",
  "plainText": "The complete formatted notes in markdown with headings, bullet points, and key details",
  "content": {
    "summary": "Brief summary",
    "notes": "Full formatted notes",
    "keyTakeaways": ["point 1", "point 2"]
  },
  "labels": ["label1", "label2"]
}`;

  contents.push(prompt);

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text || "";

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          title: "AI Generated Note",
          plainText: responseText,
          content: { text: responseText },
          labels: [],
        };
  }

  return {
    title: parsed.title || "AI Generated Note",
    plainText: parsed.plainText || "",
    content: parsed.content || { text: parsed.plainText || "" },
    labels: Array.isArray(parsed.labels) ? parsed.labels : [],
  };
};

