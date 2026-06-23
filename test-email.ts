import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  try {
    console.log("Attempting to send email as", process.env.SMTP_USER);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // send to self
      subject: "Test email from Book Exchange",
      text: "Hello world",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}
main();
