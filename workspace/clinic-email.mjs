import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { config } from 'dotenv';

config(); // Load .env

const EMAIL = process.env.CLINIC_EMAIL || 'qihatc@gmail.com';
const PASS = process.env.CLINIC_PASS;

// Send email
export async function sendEmail(to, subject, body, attachments = []) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL, pass: PASS }
  });

  const mailOptions = {
    from: EMAIL,
    to,
    subject,
    text: body,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email sent:', info.messageId);
  return info;
}

// Read recent emails with full content
export function readEmails(count = 10, fullContent = false) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: EMAIL,
      password: PASS,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { reject(err); return; }

        const total = box.messages.total;
        const start = Math.max(1, total - count + 1);
        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err) {
                emails.push({
                  seqno,
                  from: parsed.from?.text,
                  to: parsed.to?.text,
                  subject: parsed.subject,
                  date: parsed.date,
                  text: fullContent ? parsed.text : parsed.text?.substring(0, 500),
                  html: parsed.html
                });
              }
            });
          });
        });

        fetch.once('end', () => {
          imap.end();
          setTimeout(() => resolve(emails), 1000);
        });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
}

// Search for contact form emails
export async function getContactForms(count = 10) {
  const emails = await readEmails(count, true);
  return emails.filter(e =>
    e.subject?.toLowerCase().includes('contact') ||
    e.subject?.toLowerCase().includes('form') ||
    e.subject?.toLowerCase().includes('submission')
  );
}

// CLI usage
const [,, action, ...args] = process.argv;

if (action === 'send') {
  const [to, subject, ...bodyParts] = args;
  sendEmail(to, subject, bodyParts.join(' ')).catch(console.error);
} else if (action === 'read') {
  const count = parseInt(args[0]) || 10;
  readEmails(count, true).then(emails => {
    emails.reverse().forEach((e, i) => {
      console.log(`\n--- Email ${i + 1} ---`);
      console.log(`From: ${e.from}`);
      console.log(`Subject: ${e.subject}`);
      console.log(`Date: ${e.date}`);
      console.log(`Body:\n${e.text}`);
    });
  }).catch(console.error);
} else if (action === 'contacts') {
  const count = parseInt(args[0]) || 20;
  getContactForms(count).then(emails => {
    if (emails.length === 0) {
      console.log('No contact form submissions found.');
      return;
    }
    emails.reverse().forEach((e, i) => {
      console.log(`\n========== Contact Form ${i + 1} ==========`);
      console.log(`From: ${e.from}`);
      console.log(`Subject: ${e.subject}`);
      console.log(`Date: ${e.date}`);
      console.log(`\nFull Content:\n${e.text}`);
      console.log('==========================================');
    });
  }).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node clinic-email.mjs read [count]');
  console.log('  node clinic-email.mjs contacts [count]');
  console.log('  node clinic-email.mjs send <to> <subject> <body>');
}
