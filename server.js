require('dotenv').config();

const express = require('express');
const { Resend } = require('resend');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/send', async (req, res) => {
  try {
    const name = String(req.body.name || 'Анонимно').trim().slice(0, 80);
    const grade = String(req.body.grade || 'Не указано').trim().slice(0, 40);
    const contact = String(req.body.contact || 'Не указано').trim().slice(0, 120);
    const problem = String(req.body.problem || '').trim().slice(0, 3000);

    if (problem.length < 10) {
      return res.status(400).json({
        ok: false,
        message: 'Мәселені толығырақ жазыңыз: кемінде 10 таңба.'
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

    const html = `
      <h2>Алға қадам: жаңа хабарлама</h2>
      <p><b>ID:</b> ${requestId}</p>
      <p><b>Уақыты:</b> ${submittedAt}</p>
      <p><b>Аты:</b> ${name}</p>
      <p><b>Сынып / топ:</b> ${grade}</p>
      <p><b>Байланыс:</b> ${contact}</p>
      <hr>
      <p><b>Мәселе:</b></p>
      <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.5;">${problem}</p>
    `;

    const text = `
Алға қадам: жаңа хабарлама

ID: ${requestId}
Уақыты: ${submittedAt}
Аты: ${name}
Сынып / топ: ${grade}
Байланыс: ${contact}

Мәселе:
${problem}
`;

    const result = await resend.emails.send({
      from: 'Алға қадам <onboarding@resend.dev>',
      to: process.env.RECIPIENT_EMAIL,
      subject: 'Алға қадам: жаңа хабарлама',
      html,
      text
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({
        ok: false,
        message: 'Хабарлама жіберілмеді.'
      });
    }

    return res.json({
      ok: true,
      message: 'Хабарлама жіберілді. Сеніміңізге рахмет.'
    });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Хабарлама жіберілмеді.'
    });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Алға қадам site is running on port ${PORT}`);
});
