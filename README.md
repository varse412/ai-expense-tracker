# AI Expense Tracker

A full-stack expense tracking app that uses AI to parse natural language input.

Built by: Varun Sehgal
GitHub: https://github.com/varse412
Time to build: [30 min] (with AI assistance)

## 🎥 Demo

https://drive.google.com/file/d/1TYyxmtABWGItC7wXdjb2xpr3Kn5G_5Ip/view?usp=sharing

## 🛠️ Tech Stack

- **Mobile:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** SQLite (better-sqlite3, WAL mode)
- **AI:** Groq API (llama-3.3-70b-versatile)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Groq API key — get one free at [console.groq.com](https://console.groq.com)
For backend clone repo https://github.com/varse412/ai-expense-tracker.git
### Backend
```bash
cd backend
npm install
cp .env.example .env
# Add your Groq API key to .env:  GROQ_API_KEY=your_key_here
npm run dev
```
For frontend repository use repo clone https://github.com/varse412/mobile.git
Server runs on `http://localhost:3000`. Health check: `GET /health`

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
# Set your machine's local IP in .env:  EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
npm start
# Scan QR code with Expo Go app
```

## 📁 Project Structure
I used the detailed artifact provided itself as prompt along with several prompts for debugging llm api issues and for enhacements in the user experience.
Attaching links of the llms used in various ways both agentic and chat based using amazon q(claude sonnet models) and claude web chat interface links and mds :
https://claude.ai/share/e246e39e-39c6-4fcf-b861-722c583e0818
q-dev-chat-2026-04-02-api-service.md
q-dev-chat-2026-04-02-enhancements.md
```
ai-expense-tracker/
├── backend/
│   └── src/
│       ├── index.ts          # Express server entry point
│       ├── routes/
│       │   └── expenses.ts   # CRUD API routes (/api/expenses)
│       ├── services/
│       │   └── aiService.ts  # Groq API integration & prompt logic
│       └── database/
│           └── db.ts         # SQLite setup and query helpers
└── mobile/
    ├── App.tsx               # Main UI — input, expense list, edit modal
    └── src/services/
        └── api.ts            # Axios client with offline cache fallback
```


**Backend** exposes a REST API:
- `POST /api/expenses` — parse natural language input via AI and save
- `GET /api/expenses` — fetch all expenses (newest first)
- `PUT /api/expenses/:id` — edit an expense
- `DELETE /api/expenses/:id` — delete an expense

**Mobile** features:
- Natural language input (e.g. *"Spent 500 on groceries at BigBasket"*)
- Category filter pills with emoji
- Inline edit modal with category picker
- Offline mode with local cache fallback
- Total spend summary card

## 🤖 AI Prompt Design

I used this system prompt for expense parsing:

```
You are a strict expense parser. Extract structured expense data from natural language.
Output ONLY valid JSON, no markdown, no explanation.
```

Key design decisions:
- **Strict JSON-only output** — no markdown fences or prose, making `JSON.parse()` reliable
- **Explicit error shape** — the model returns `{"error":"...","amount":null}` for unparseable input, so the app can show a friendly message without crashing
- **Amount normalisation rules** — handles words (`"fifty" → 50`), shorthand (`"1.5k" → 1500`), and Indian units (`"2 lakhs" → 200000`)
- **Currency detection** — defaults to INR; detects symbols (`$`, `€`, `£`, `¥`, `₹`) and words (`"dollars"`, `"euros"`)
- **8 fixed categories** — prevents hallucinated categories and maps cleanly to UI colours and emoji
- **Merchant extraction** — only extracts a merchant when a specific brand/business name is present; returns `null` otherwise to avoid noise
- **Description rule** — instructs the model to write a clean 3–7 word title-case summary rather than echoing the raw input
