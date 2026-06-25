require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const requiredEnv = [
  'RECIPIENT_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Warning: missing environment variable ${key}`);
  }
}

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Very simple in-memory rate limit: 5 submissions per 10 minutes per IP.
const attempts = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

  const recent = (attempts.get(ip) || []).filter((time) => now - time < windowMs);
  if (recent.length >= maxRequests) {
    return res.status(429).json({
      ok: false,
      message: 'Слишком много отправок. Попробуйте позже.'
    });
  }

  recent.push(now);
  attempts.set(ip, recent);
  next();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.post('/api/send', rateLimit, async (req, res) => {
  try {
    // Honeypot field: normal students will not fill it.
    if (req.body.website) {
      return res.json({ ok: true, message: 'Сообщение отправлено.' });
    }

    const name = cleanText(req.body.name, 80) || 'Анонимно';
    const grade = cleanText(req.body.grade, 40) || 'Не указано';
    const problem = cleanText(req.body.problem, 3000);
    const contact = cleanText(req.body.contact, 120) || 'Не указано';

    if (problem.length < 10) {
      return res.status(400).json({
        ok: false,
        message: 'Напишите проблему подробнее: минимум 10 символов.'
      });
    }

    const requestId = crypto.randomUUID();
    const submittedAt = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Almaty',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const text = [
      'Новое сообщение с сайта «Алға қадам»',
      '',
      `ID: ${requestId}`,
      `Время: ${submittedAt} (Asia/Almaty)`,
      `Имя: ${name}`,
      `Класс/группа: ${grade}`,
      `Контакт для ответа: ${contact}`,
      '',
      'Проблема ученика:',
      problem
    ].join('\n');

    const html = `
      <h2>Новое сообщение с сайта «Алға қадам»</h2>
      <p><b>ID:</b> ${escapeHtml(requestId)}</p>
      <p><b>Время:</b> ${escapeHtml(submittedAt)} (Asia/Almaty)</p>
      <p><b>Имя:</b> ${escapeHtml(name)}</p>
      <p><b>Класс/группа:</b> ${escapeHtml(grade)}</p>
      <p><b>Контакт для ответа:</b> ${escapeHtml(contact)}</p>
      <hr>
      <p><b>Проблема ученика:</b></p>
      <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.5;">${escapeHtml(problem)}</p>
    `;

    await transporter.sendMail({
      from: `Алға қадам <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Алға қадам: новое сообщение от ученика`,
      text,
      html,
      replyTo: contact.includes('@') ? contact : undefined
    });

    return res.json({
      ok: true,
      message: 'Сообщение отправлено. Спасибо за доверие.'
    });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Не удалось отправить сообщение. Попробуйте позже или обратитесь лично к ответственному взрослому.'
    });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Алға қадам site is running: http://localhost:${PORT}`);
});
