import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models";

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ["id", "email", "role", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByPk(Number(req.params["id"]), {
      attributes: ["id", "email", "role", "createdAt"],
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role?: "ADMIN" | "USER";
    };

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params["id"]);

    if (userId === req.user!.id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await user.destroy();
    res.status(204).send();
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
