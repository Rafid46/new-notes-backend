import { prisma } from "../config/db.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenUtils.js";

export const createUser = async (req, res) => {
  try {
    const { id, email_addresses, first_name, last_name, image_url } =
      req.body.data || req.body;
    const email = email_addresses
      ? email_addresses[0]?.email_address
      : req.body.email;
    const name =
      first_name || last_name
        ? `${first_name || ""} ${last_name || ""}`.trim()
        : req.body.name;

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    user = await prisma.user.create({
      data: {
        id,
        email,
        name,
        avatarUrl: image_url,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({ success: true, user, accessToken, refreshToken });
  } catch (error) {
    console.error("Error creating user:", error);
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

export const loginUser = async (req, res) => {
  try {
    const { email_addresses, first_name, last_name, image_url } =
      req.body.data || req.body;
    const email = email_addresses
      ? email_addresses[0]?.email_address
      : req.body.email;
    const name =
      first_name || last_name
        ? `${first_name || ""} ${last_name || ""}`.trim()
        : req.body.name;

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update avatar and name on login
    user = await prisma.user.update({
      where: { email },
      data: { name, avatarUrl: image_url },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({ success: true, user, accessToken, refreshToken });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Refresh Token is required" });

  try {
    const decoded = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken(decoded.id);
    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid refresh token." });
  }
};
