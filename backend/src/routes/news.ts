import { Router } from 'express';
import { NewsDb, News } from '../models/db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/news (Public)
router.get('/', (req, res) => {
  const news = NewsDb.find();
  // Sort latest news first
  const sortedNews = [...news].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(sortedNews);
});

// POST /api/news (Admin only)
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const newNews = NewsDb.create({
      title,
      content
    });

    return res.status(201).json(newNews);
  } catch (error) {
    console.error('Create news error:', error);
    return res.status(500).json({ message: 'Server error during news creation.' });
  }
});

// PUT /api/news/:id (Admin only)
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const news = NewsDb.findById(id);

  if (!news) {
    return res.status(404).json({ message: 'News article not found.' });
  }

  const { title, content } = req.body;
  const updates: Partial<News> = {};

  if (title) updates.title = title;
  if (content) updates.content = content;

  try {
    const updatedNews = NewsDb.findByIdAndUpdate(id, updates);
    return res.json(updatedNews);
  } catch (error) {
    console.error('Update news error:', error);
    return res.status(500).json({ message: 'Server error during news update.' });
  }
});

// DELETE /api/news/:id (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const news = NewsDb.findById(id);

  if (!news) {
    return res.status(404).json({ message: 'News article not found.' });
  }

  try {
    NewsDb.findByIdAndDelete(id);
    return res.json({ message: 'News article deleted successfully.' });
  } catch (error) {
    console.error('Delete news error:', error);
    return res.status(500).json({ message: 'Server error during news deletion.' });
  }
});

export default router;
