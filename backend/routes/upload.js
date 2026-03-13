const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
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
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    res.status(200).json({
      message: 'PDF uploaded successfully',
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;