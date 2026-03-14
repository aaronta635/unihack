const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');
const pdfParsePkg = require('pdf-parse');
const PDFParse = pdfParsePkg.PDFParse || pdfParsePkg.default || pdfParsePkg;
const { getSupabase } = require('../supabaseClient');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/** Health check: GET /api/health - use this to verify server is reachable */
router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API is up', timestamp: new Date().toISOString() });
});

/**
 * Use GPT-4 to extract/generate MCQs from PDF text. Returns:
 * [{ title, choice1, choice2, choice3, choice4, answer }, ...]
 * answer is 1-4 (which choice is correct).
 */
async function generateQuestionsFromText(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const systemPrompt = `You are a helpful assistant that turns educational content into multiple-choice questions.
Output a JSON object with a single key "questions" whose value is an array of question objects.
Each question must have exactly: title (string), choice1, choice2, choice3, choice4 (strings), answer (number 1-4).
Generate up to 10 questions from the content. Use the text as the source; extract or adapt questions so they have one correct answer.`;

  const userPrompt = `Turn the following content into multiple-choice questions. Return only valid JSON in this exact shape: { "questions": [ { "title": "...", "choice1": "...", "choice2": "...", "choice3": "...", "choice4": "...", "answer": 1 } ] }\n\nContent:\n${text.slice(0, 12000)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(raw);
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

  return questions.map((q) => ({
    title: String(q.title || '').trim() || 'Untitled question',
    choice1: String(q.choice1 ?? '').trim(),
    choice2: String(q.choice2 ?? '').trim(),
    choice3: String(q.choice3 ?? '').trim(),
    choice4: String(q.choice4 ?? '').trim(),
    answer: Math.min(4, Math.max(1, parseInt(q.answer, 10) || 1)),
  }));
}

router.post('/pdf-to-questions', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'No file uploaded. Use multipart/form-data field name "file".' });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    const text = (result && result.text ? result.text : '').trim();
    await parser.destroy();

    if (!text) {
      return res.status(400).json({ error: 'Could not extract any text from PDF.' });
    }

    const questions = await generateQuestionsFromText(text);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions generated.' });
    }

    // Basic validation for your minimal schema
    for (const q of questions) {
      if (
        !q ||
        typeof q.title !== 'string' ||
        typeof q.choice1 !== 'string' ||
        typeof q.choice2 !== 'string' ||
        typeof q.choice3 !== 'string' ||
        typeof q.choice4 !== 'string' ||
        typeof q.answer !== 'number'
      ) {
        return res.status(400).json({ error: 'Generated questions have invalid shape.' });
      }
      if (q.answer < 1 || q.answer > 4) {
        return res.status(400).json({ error: 'Answer must be 1-4.' });
      }
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('questions')
      .insert(
        questions.map((q) => ({
          title: q.title,
          choice1: q.choice1,
          choice2: q.choice2,
          choice3: q.choice3,
          choice4: q.choice4,
          answer: q.answer,
        }))
      )
      .select('id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Inserted questions from PDF.',
      insertedCount: data?.length || 0,
      ids: (data || []).map((r) => r.id),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Dev-only: run PDF → questions using the file at public/pdf/test.pdf
 * GET http://localhost:3000/api/pdf-to-questions-test
 */
const DEV_PDF_PATH = path.resolve(__dirname, '../public/pdf/test.pdf');

router.get('/pdf-to-questions-test', async (req, res, next) => {
  try {
    if (!fs.existsSync(DEV_PDF_PATH)) {
      return res.status(404).json({
        error: 'Dev PDF not found.',
        triedPath: DEV_PDF_PATH,
        hint: 'Ensure backend/public/pdf/test.pdf exists.',
      });
    }
    const buffer = fs.readFileSync(DEV_PDF_PATH);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = (result && result.text ? result.text : '').trim();
    await parser.destroy();

    if (!text) {
      return res.status(400).json({ error: 'Could not extract any text from PDF.' });
    }

    const questions = await generateQuestionsFromText(text);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions generated.' });
    }

    for (const q of questions) {
      if (
        !q ||
        typeof q.title !== 'string' ||
        typeof q.choice1 !== 'string' ||
        typeof q.choice2 !== 'string' ||
        typeof q.choice3 !== 'string' ||
        typeof q.choice4 !== 'string' ||
        typeof q.answer !== 'number'
      ) {
        return res.status(400).json({ error: 'Generated questions have invalid shape.' });
      }
      if (q.answer < 1 || q.answer > 4) {
        return res.status(400).json({ error: 'Answer must be 1-4.' });
      }
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('questions')
      .insert(
        questions.map((q) => ({
          title: q.title,
          choice1: q.choice1,
          choice2: q.choice2,
          choice3: q.choice3,
          choice4: q.choice4,
          answer: q.answer,
        }))
      )
      .select('id');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Inserted questions from dev PDF.',
      insertedCount: data?.length || 0,
      ids: (data || []).map((r) => r.id),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/questions', async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('questions')
      .select('id,title,choice1,choice2,choice3,choice4,answer,created_at')
      .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ questions: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;