import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { generateToken } from '../middleware/auth';

// POST /api/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role?: 'ADMIN' | 'USER';
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
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
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
