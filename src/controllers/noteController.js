import { prisma } from "../config/db.js";

export const createNote = async (req, res) => {
  try {
    const { title, content, plainText, labels, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId, attachments } = req.body;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const note = await prisma.note.create({
      data: {
        userId, title, content, plainText, labels, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId,
        attachments: attachments ? { create: attachments } : undefined
      },
      include: { attachments: true }
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
    const notes = await prisma.note.findMany({
      where: { userId },
      include: { attachments: true, label: true }
    });
    res.status(200).json({ success: true, notes });
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
    const { title, content, plainText, labels, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId } = req.body;
    const note = await prisma.note.update({
      where: { id },
      data: { title, content, plainText, labels, background, headerColor, headerFont, boardX, boardY, sortOrder, parentId, labelId },
      include: { attachments: true }
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
