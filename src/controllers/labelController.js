import { prisma } from "../config/db.js";

export const createLabel = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    if (!userId || !name) {
      return res.status(400).json({ success: false, message: "userId and name are required" });
    }

    const label = await prisma.label.create({
      data: { userId, name },
    });

    res.status(201).json({ success: true, label });
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const getLabels = async (req, res) => {
  try {
    const userId = req.user.id;
    const labels = await prisma.label.findMany({
      where: { userId },
      include: { notes: true },
    });

    res.status(200).json({ success: true, labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const getLabelById = async (req, res) => {
  try {
    const { id } = req.params;
    const label = await prisma.label.findUnique({
      where: { id },
      include: { notes: true },
    });

    if (!label) {
      return res.status(404).json({ success: false, message: "Label not found" });
    }

    res.status(200).json({ success: true, label });
  } catch (error) {
    console.error("Error fetching label:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const label = await prisma.label.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({ success: true, label });
  } catch (error) {
    console.error("Error updating label:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.label.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Label deleted" });
  } catch (error) {
    console.error("Error deleting label:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const setNoteLabel = async (req, res) => {
  try {
    const { noteId, labelId } = req.body;
    if (!noteId) {
      return res.status(400).json({ success: false, message: "noteId is required" });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { labelId: labelId || null },
      include: { label: true },
    });

    res.status(200).json({ success: true, note });
  } catch (error) {
    console.error("Error updating note label:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
