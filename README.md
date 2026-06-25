# Алға қадам

Private support form for students. Messages are sent to one email address through a Node.js backend.

## Run in VS Code

1. Install Node.js 20+.
2. Open this folder in VS Code.
3. Open Terminal and run:

```bash
npm install
```

4. Copy `.env.example` and rename the copy to `.env`.
5. Fill in your SMTP data in `.env`.
6. Start the site:

```bash
npm start
```

7. Open:

```text
http://localhost:3000
```

## Important

Do not upload `.env` to GitHub. Do not put SMTP passwords into HTML, CSS, or browser JavaScript.
