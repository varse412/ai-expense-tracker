import { Router, Request, Response } from 'express';
import { parseExpense } from '../services/aiService';
import { createExpense, getAllExpenses, deleteExpense, updateExpense } from '../database/db';

const router = Router();

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide an expense description.' });
    }

    const parsed = await parseExpense(input.trim());
    if (!parsed) {
      return res.status(400).json({ success: false, error: 'Could not parse expense. Please include an amount.' });
    }

    const expense = createExpense({ ...parsed, original_input: input.trim() });
    return res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/expenses
router.get('/', (_req: Request, res: Response) => {
  try {
    const expenses = getAllExpenses();
    return res.json({ success: true, expenses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as any, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const { amount, currency, category, description, merchant } = req.body;
    if (!amount || !category || !description) {
      return res.status(400).json({ success: false, error: 'amount, category and description are required.' });
    }

    const updated = updateExpense(id, { amount, currency: currency || 'INR', category, description, merchant: merchant || null });
    if (!updated) return res.status(404).json({ success: false, error: 'Expense not found' });

    return res.json({ success: true, expense: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as any, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    const deleted = deleteExpense(id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Expense not found' });

    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;