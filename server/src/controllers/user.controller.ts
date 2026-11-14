import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../services/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { UpdateProfileInput } from "../schemas";

/**
 * GET /api/users/me
 * Returns authenticated user's profile details.
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

/**
 * PATCH /api/users/me
 * Update display name and/or password.
 * Changing password requires verifying currentPassword with bcrypt.
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { name, currentPassword, newPassword } = req.body as UpdateProfileInput;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updateData: { name?: string; passwordHash?: string } = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: "Current password is required to change password" });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ message: "Current password entered is incorrect" });
        return;
      }

      // Hash new password securely with 12 salt rounds
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No update fields provided" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
