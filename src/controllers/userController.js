import { prisma } from "../config/db.js";

export const createUser = async (req, res) => {
  try {
    const { id, email_addresses, first_name, last_name, image_url } =
      req.body.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { email },
        data: { name, avatarUrl: image_url },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id,
          email,
          name,
          avatarUrl: image_url,
        },
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
