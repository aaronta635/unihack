const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const pdfParsePkg = require('pdf-parse');
const PDFParse = pdfParsePkg.PDFParse || pdfParsePkg.default || pdfParsePkg;
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateQuestionsFromText(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const systemPrompt = `You are a helpful assistant that turns educational content into multiple-choice questions.\nOutput a JSON object with a single key "questions" whose value is an array of question objects.\nEach question must have exactly: title (string), choice1, choice2, choice3, choice4 (strings), answer (number 1-4).\nGenerate up to 10 questions from the content. Use the text as the source; extract or adapt questions so they have one correct answer.`;
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
const multer = require('multer');

const upload = multer({
    storage:multer.memoryStorage(),
    limits:{fileSize: 10 * 1024 * 1024,
    },
    fileFilter:(req, file, cb) => {
        if(file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

/**
 * @swagger
 * /upload/pdf:
 *   post:
 *     summary: Upload a PDF to Supabase Storage
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: PDF uploaded successfully
 *       400:
 *         description: Upload failed
 */
router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    // Parse PDF buffer
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    const text = (result && result.text ? result.text : '').trim();
    await parser.destroy();
    if (!text) {
      return res.status(400).json({ error: 'Could not extract any text from PDF.' });
    }
    // Generate questions
    const questions = await generateQuestionsFromText(text);
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions generated.' });
    }
    // Validate questions
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
    // Store questions and minimal metadata
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
          fileName,
          uploadedAt: new Date().toISOString(),
        }))
      )
      .select('id');
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({
      message: 'Questions generated and stored.',
      insertedCount: data?.length || 0,
      ids: (data || []).map((r) => r.id),
      fileName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;