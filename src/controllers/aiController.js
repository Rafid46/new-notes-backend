import { prisma } from "../config/db.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { generateNoteFromContent } from "../services/aiService.js";

export const convertAndCreateNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      text,
      command,
      saveToDb = true,
      parentId,
      labelId,
      labels,
      category,
      background,
      headerColor,
      headerFont,
      boardX,
      boardY,
    } = req.body;

    const file = req.file;

    if (!file && (!text || !text.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a file or text content.",
      });
    }

    const generated = await generateNoteFromContent({
      text,
      file,
      command,
    });

    const shouldSave = saveToDb === true || saveToDb === "true";

    let uploadResult = null;
    if (file && shouldSave) {
      uploadResult = await uploadToCloudinary(file.buffer, {
        folder: "notes_attachments",
      });
    }

    const userLabels = Array.isArray(labels)
      ? labels
      : labels
      ? [labels]
      : category
      ? [category]
      : [];

    const finalLabels = Array.from(
      new Set([...generated.labels, ...userLabels])
    );

    if (!shouldSave) {
      return res.status(200).json({
        success: true,
        note: {
          ...generated,
          labels: finalLabels,
        },
        attachment: uploadResult
          ? {
              fileName: file.originalname,
              mimeType: file.mimetype,
              storageKey: uploadResult.secure_url,
            }
          : null,
      });
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title: generated.title || "Untitled",
        content: generated.content,
        plainText: generated.plainText,
        labels: finalLabels,
        background,
        headerColor,
        headerFont,
        boardX: boardX ? parseFloat(boardX) : null,
        boardY: boardY ? parseFloat(boardY) : null,
        parentId: parentId || null,
        labelId: labelId || null,
        attachments:
          file && uploadResult
            ? {
                create: {
                  fileName: file.originalname,
                  mimeType: file.mimetype,
                  storageKey: uploadResult.secure_url,
                },
              }
            : undefined,
      },
      include: {
        attachments: true,
        label: true,
        children: true,
      },
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process AI conversion",
    });
  }
};

