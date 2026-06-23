import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { generateToken } from '../middleware/auth';

// POST /api/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'USER',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/mailerService';
import { Op } from 'sequelize';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't leak if user exists
      res.json({ message: 'If that email exists, a reset link was sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ message: 'Password has been successfully reset' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
