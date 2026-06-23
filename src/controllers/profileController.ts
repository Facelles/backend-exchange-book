import { Request, Response } from "express";
import { User, Book, ExchangeRequest } from "../models";

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ["id", "email", "name", "avatarUrl", "role", "createdAt"],
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const bookCount = await Book.count({ where: { ownerId: user.id } });

    res.json({ ...user.toJSON(), bookCount });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, avatarUrl } = req.body as {
      name?: string;
      email?: string;
      avatarUrl?: string;
    };

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        res.status(409).json({ message: "Email already in use" });
        return;
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getExchangeRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const incomingRequests = await ExchangeRequest.findAll({
      where: { receiverId: req.user!.id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "email", "name", "avatarUrl"],
        },
        {
          model: Book,
          as: "book",
          attributes: ["id", "name", "author", "photoUrl"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(incomingRequests);
  } catch (err) {
    console.error("getExchangeRequests error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
