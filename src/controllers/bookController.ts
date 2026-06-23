import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Book, User, ExchangeRequest } from '../models';
import { sendExchangeEmail } from '../services/mailerService';

export const getBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const book = await Book.findByPk(Number(req.params['id']), {
      include: [{ model: User, as: 'owner', attributes: ['id', 'email'] }],
    });

    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    res.json(book);
  } catch (err) {
    console.error('getBookById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query['search'] as string | undefined) ?? '';
    const limit = Math.min(Number(req.query['limit'] ?? 10), 100);
    const offset = Number(req.query['offset'] ?? 0);

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { author: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Book.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'email'] }],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    res.json({ total: count, limit, offset, data: rows });
  } catch (err) {
    console.error('getBooks error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const books = await Book.findAll({
      where: { ownerId: req.user!.id },
      order: [['name', 'ASC']],
    });

    res.json(books);
  } catch (err) {
    console.error('getMyBooks error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, author, photoUrl } = req.body as {
      name: string;
      author: string;
      photoUrl?: string;
    };

    if (!name || !author) {
      res.status(400).json({ message: 'name and author are required' });
      return;
    }

    const book = await Book.create({
      name,
      author,
      photoUrl: photoUrl ?? null,
      ownerId: req.user!.id,
    });

    res.status(201).json(book);
  } catch (err) {
    console.error('createBook error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params['id']);
    const book = await Book.findByPk(bookId);

    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    const isOwner = book.ownerId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Forbidden: not the owner of this book' });
      return;
    }

    await book.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('deleteBook error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requestExchange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookId = Number(req.params['id']);

    const book = await Book.findByPk(bookId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'email'] }],
    });

    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }

    if (book.ownerId === req.user!.id) {
      res.status(400).json({ message: 'You cannot exchange your own book' });
      return;
    }

    const senderBooks = await Book.findAll({
      where: { ownerId: req.user!.id },
      attributes: ['id', 'name', 'author'],
    });

    const owner = book.owner!;

    await sendExchangeEmail({
      toEmail: owner.email,
      ownerName: owner.email,
      senderEmail: req.user!.email,
      requestedBook: { name: book.name, author: book.author },
      senderBooks,
    });

    await ExchangeRequest.create({
      senderId: req.user!.id,
      receiverId: book.ownerId,
      bookId: book.id,
      status: 'PENDING',
    });

    res.json({ message: `Exchange request sent to ${owner.email}` });
  } catch (err) {
    console.error('requestExchange error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
