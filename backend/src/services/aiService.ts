import dotenv from 'dotenv';
dotenv.config();

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
}

const SYSTEM_PROMPT = `You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract the amount as a number (no currency symbols)
2. Default currency is INR unless explicitly mentioned (USD, EUR, etc.)
3. Categorize into EXACTLY one of: Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Health, Travel, Other
4. Description should be a clean summary (not the raw input)
5. Merchant is the company/store name if mentioned, null otherwise

RESPOND ONLY WITH VALID JSON, no other text:
{"amount":<number>,"currency":"<string>","category":"<string>","description":"<string>","merchant":"<string or null>"}

If you cannot extract an amount, respond:
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