import dotenv from 'dotenv';
dotenv.config();

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
}

const SYSTEM_PROMPT = `You are a strict expense parser. Extract structured expense data from natural language. Output ONLY valid JSON, no markdown, no explanation.

AMOUNT RULES:
- Extract as a positive number only (no symbols, no commas)
- Handle words: "fifty" → 50, "1.5k" → 1500, "2 lakhs" → 200000
- If multiple amounts mentioned, use the one most likely to be the expense total
- If no amount found or input is not an expense, return the error JSON

CURRENCY RULES:
- Default: INR
- Detect: $→USD, €→EUR, £→GBP, ¥→JPY, ₹→INR, "dollars"→USD, "euros"→EUR

CATEGORY RULES — pick EXACTLY one:
- Food & Dining: restaurants, cafes, food delivery, groceries, snacks, drinks
- Transport: cab, auto, bus, train, metro, fuel, parking, flight tickets
- Shopping: clothes, electronics, online orders, accessories
- Entertainment: movies, games, subscriptions (Netflix/Spotify), events
- Bills & Utilities: electricity, water, internet, phone recharge, rent
- Health: medicine, doctor, hospital, gym, pharmacy
- Travel: hotels, trips, vacation, travel packages (not daily commute)
- Other: anything that doesn't fit above

DESCRIPTION RULES:
- Write a clean 3-7 word summary in title case
- Do NOT copy the raw input
- Example: "Spent 200 on lunch at office" → "Office Lunch"

MERCHANT RULES:
- Extract only if a specific business/brand/store name is mentioned
- Ignore generic words like "shop", "store", "restaurant"
- null if not mentioned

EDGE CASES:
- Ambiguous input like "coffee" with no amount → error JSON
- Non-expense input like "hello" or "what is 2+2" → error JSON
- Negative amounts → error JSON
- Split bills: use the total amount paid by the user if clear, else the full amount

SUCCESS RESPONSE (no other text):
{"amount":<number>,"currency":"<string>","category":"<string>","description":"<string>","merchant":<string|null>}

ERROR RESPONSE (no other text):
{"error":"Could not parse expense. Please include an amount.","amount":null}`;

export async function parseExpense(text: string): Promise<ParsedExpense | null> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => response.text());
    console.error('Groq API error body:', JSON.stringify(errBody));
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const raw = data.choices[0]?.message?.content?.trim();

  if (!raw) throw new Error('Empty response from Claude');

  const parsed = JSON.parse(raw);

  if (parsed.error || parsed.amount === null) {
    return null; // signal unparseable
  }

  return parsed as ParsedExpense;
}