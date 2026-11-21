import OpenAI from "openai";
import mammoth from "mammoth";
import { extractText } from "unpdf";

let cachedAiClient;

const getAiClient = () => {
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() || (baseURL ? "ollama" : "");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!cachedAiClient) {
    cachedAiClient = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return cachedAiClient;
};

export const generateNoteFromContent = async ({ text, file, command }) => {
  const openai = getAiClient();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const model = process.env.OPENAI_MODEL;

  let extractedText = text ? String(text) : "";
  let imageUrl = null;

  if (file) {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");

    const isDocx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname?.toLowerCase().endsWith(".docx");

    const isTextFile =
      file.mimetype?.startsWith("text/") ||
      file.originalname?.toLowerCase().endsWith(".txt") ||
      file.originalname?.toLowerCase().endsWith(".md") ||
      file.originalname?.toLowerCase().endsWith(".csv") ||
      file.originalname?.toLowerCase().endsWith(".json");

    const isImage = file.mimetype?.startsWith("image/");

    if (isPdf) {
      const pdfResult = await extractText(new Uint8Array(file.buffer), {
        mergePages: true,
      });
      extractedText = extractedText
        ? `${extractedText}\n\n${pdfResult.text}`
        : pdfResult.text;
    } else if (isDocx) {
      const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = extractedText
        ? `${extractedText}\n\n${docxResult.value}`
        : docxResult.value;
    } else if (isTextFile) {
      const fileText = file.buffer.toString("utf-8");
      extractedText = extractedText
        ? `${extractedText}\n\n${fileText}`
        : fileText;
    } else if (isImage) {
      imageUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    } else {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
  }

  const hasFile = Boolean(file);
  const userInstruction = command?.trim() || "";

  const prompt = `${userInstruction ? `User Instruction: ${userInstruction}\n\n` : ""}${extractedText ? `User Input:\n${extractedText}\n\n` : ""}Decide if this is casual conversation/general Q&A ("chat") or content/request to create structured notes ("note").
${hasFile ? 'A file was uploaded, so always respond with "type": "note".' : 'Use "chat" for greetings, small talk, or simple direct questions when the user is NOT asking to create, summarize, or format notes. Use "note" when the user provides study/meeting/article content, large text, or asks to create/summarize/convert notes.'}

Output ONLY a valid JSON object matching ONE of these two formats:

For casual chat:
{
  "type": "chat",
  "reply": "A natural, helpful conversational reply"
}

For notes:
{
  "type": "note",
  "title": "A concise and informative note title",
  "plainText": "The complete formatted notes in markdown with headings, bullet points, and key details",
  "summary": "Brief summary",
  "keyTakeaways": ["point 1", "point 2"],
  "labels": ["label1", "label2"]
}`;

  const userMessageContent = imageUrl
    ? [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: prompt },
      ]
    : prompt;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI note assistant. Respond naturally to casual chat with type 'chat', and generate structured notes with type 'note'. Always respond with valid JSON matching the requested schema.",
      },
      {
        role: "user",
        content: userMessageContent,
      },
    ],
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices?.[0]?.message?.content;
  if (!responseText) {
    throw new Error("AI service returned an empty response");
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          type: hasFile ? "note" : "chat",
          reply: responseText,
          title: "",
          plainText: responseText,
          summary: "",
          keyTakeaways: [],
          labels: [],
        };
  }

  if (!hasFile && parsed.type === "chat") {
    return {
      type: "chat",
      reply: parsed.reply || parsed.plainText || "Hello! How can I help you?",
    };
  }

  const plainText = parsed.plainText || "";

  return {
    type: "note",
    title: parsed.title || "AI Generated Note",
    plainText,
    content: {
      summary: parsed.summary || "",
      notes: plainText,
      keyTakeaways: Array.isArray(parsed.keyTakeaways)
        ? parsed.keyTakeaways
        : [],
    },
    labels: Array.isArray(parsed.labels) ? parsed.labels : [],
  };
};
