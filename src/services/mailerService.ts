import nodemailer from "nodemailer";
import Book from "../models/Book";

interface ExchangeEmailOptions {
  toEmail: string;
  ownerName: string;
  senderEmail: string;
  requestedBook: { name: string; author: string };
  senderBooks: Book[];
}

const escHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createTransporter = () => {
  const port = Number(process.env["SMTP_PORT"] ?? 465); // Default to 465 for cloud compatibility
  return nodemailer.createTransport({
    host: process.env["SMTP_HOST"] ?? "smtp.gmail.com",
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
};

const buildHtml = (opts: ExchangeEmailOptions): string => {
  const bookListHtml =
    opts.senderBooks.length > 0
      ? opts.senderBooks
          .map(
            (b) =>
              `<li><strong>${escHtml(b.name)}</strong> by ${escHtml(b.author)}</li>`,
          )
          .join("")
      : "<li><em>No books listed yet</em></li>";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Book Exchange Request</h2>
      <p>Hello <strong>${escHtml(opts.ownerName)}</strong>,</p>
      <p>
        <strong>${escHtml(opts.senderEmail)}</strong> is interested in exchanging for your book:
      </p>
      <blockquote style="border-left: 4px solid #6c63ff; padding-left: 12px; margin: 16px 0;">
        <strong>${escHtml(opts.requestedBook.name)}</strong> — <em>${escHtml(opts.requestedBook.author)}</em>
      </blockquote>
      <h3>Books they are offering:</h3>
      <ul>${bookListHtml}</ul>
      <p>
        Reply directly to <a href="mailto:${escHtml(opts.senderEmail)}">${escHtml(opts.senderEmail)}</a>
        to arrange the exchange.
      </p>
      <hr/>
      <p style="color: #888; font-size: 12px;">
        This message was sent via Book Exchange Service.
      </p>
    </div>
  `;
};

export const sendExchangeEmail = async (
  opts: ExchangeEmailOptions,
): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from:
      process.env["SMTP_FROM"] ?? '"Book Exchange" <no-reply@bookexchange.com>',
    to: opts.toEmail,
    replyTo: opts.senderEmail,
    subject: `Exchange request for "${opts.requestedBook.name}"`,
    html: buildHtml(opts),
  });
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  token: string,
): Promise<void> => {
  const transporter = createTransporter();
  const frontendUrl = process.env["FRONTEND_URL"]?.replace(/\/$/, "") ?? "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
    </div>
  `;

  console.log(`\n================================`);
  console.log(`PASSWORD RESET URL (For Testing):`);
  console.log(resetUrl);
  console.log(`================================\n`);

  await transporter.sendMail({
    from:
      process.env["SMTP_FROM"] ?? '"Book Exchange" <no-reply@bookexchange.com>',
    to: toEmail,
    subject: "Password Reset - Book Exchange",
    html,
  });
};
