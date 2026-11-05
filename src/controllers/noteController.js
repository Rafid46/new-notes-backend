import { prisma } from "../config/db.js";

export const createNote = async (req, res) => {
  try {
    const { title, content, plainText, labels, category, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId, attachments } = req.body;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const noteLabels = Array.isArray(labels)
      ? labels
      : labels
      ? [labels]
      : category
      ? [category]
      : [];
    const note = await prisma.note.create({
      data: {
        userId, title, content, plainText,
        labels: noteLabels,
        background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId,
        attachments: attachments ? { create: attachments } : undefined
      },
      include: { attachments: true, label: true, children: true }
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyword, limit, skip } = req.query;

    const take = limit ? parseInt(limit, 10) : undefined;
    const skipCount = skip ? parseInt(skip, 10) : undefined;

    const where = {
      userId,
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { plainText: { contains: keyword, mode: "insensitive" } },
              { label: { name: { contains: keyword, mode: "insensitive" } } },
              { labels: { has: keyword } },
            ],
          }
        : {}),
    };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        take,
        skip: skipCount,
        orderBy: { updatedAt: "desc" },
        include: { attachments: true, label: true },
      }),
      prisma.note.count({ where }),
    ]);

    res.status(200).json({ success: true, notes, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({
      where: { id },
      include: { attachments: true, label: true, children: true }
    });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    res.status(200).json({ success: true, note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, plainText, labels, category, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId } = req.body;
    const noteLabels = Array.isArray(labels)
      ? labels
      : labels !== undefined
      ? [labels]
      : category !== undefined
      ? [category]
      : undefined;
    const note = await prisma.note.update({
      where: { id },
      data: {
        title, content, plainText,
        labels: noteLabels,
        background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId
      },
      include: { attachments: true, label: true, children: true }
    });
    res.status(200).json({ success: true, note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
