import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config(); // Load .env

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'fengbo0724@gmail.com',
    pass: process.env.GMAIL_PASS
  }
});

// Usage: node send-email.mjs <to> <subject> <body> [attachment_path]
const [,, to, subject, body, attachmentPath] = process.argv;

if (!to || !subject || !body) {
  console.log('Usage: node send-email.mjs <to> <subject> <body> [attachment_path]');
  process.exit(1);
}

const mailOptions = {
  from: 'fengbo0724@gmail.com',
  to,
  subject,
  text: body
};

if (attachmentPath) {
  const filename = attachmentPath.split(/[/\\]/).pop();
  mailOptions.attachments = [{
    filename,
    path: attachmentPath
  }];
}

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  }
});
