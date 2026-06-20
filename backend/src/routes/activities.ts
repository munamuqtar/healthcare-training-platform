import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ActivityDb, Activity } from '../models/db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure Multer storage
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|webm|ogg/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images and videos are allowed!'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// GET /api/activities (Public)
router.get('/', (req, res) => {
  const activities = ActivityDb.find();
  return res.json(activities);
});

// POST /api/activities (Admin only) - Accepts multipart files or JSON body with URLs/Base64
router.post('/', authMiddleware, requireAdmin, upload.array('files', 5), (req, res) => {
  const { title, description, activityDate, images, videos } = req.body;

  if (!title || !description || !activityDate) {
    return res.status(400).json({ message: 'Title, description, and date are required.' });
  }

  // Gather uploaded files
  const fileImages: string[] = [];
  const fileVideos: string[] = [];

  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    files.forEach(file => {
      const relativePath = `/uploads/${file.filename}`;
      if (file.mimetype.startsWith('video/')) {
        fileVideos.push(relativePath);
      } else {
        fileImages.push(relativePath);
      }
    });
  }

  // Handle JSON body URLs or base64 if provided
  let bodyImages: string[] = [];
  let bodyVideos: string[] = [];

  if (images) {
    bodyImages = Array.isArray(images) ? images : [images];
  }
  if (videos) {
    bodyVideos = Array.isArray(videos) ? videos : [videos];
  }

  const finalImages = [...fileImages, ...bodyImages];
  const finalVideos = [...fileVideos, ...bodyVideos];

  // If no media, use a professional healthcare graphic placeholder
  if (finalImages.length === 0) {
    finalImages.push('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80');
  }

  try {
    const newActivity = ActivityDb.create({
      title,
      description,
      images: finalImages,
      videos: finalVideos,
      activityDate
    });

    return res.status(201).json(newActivity);
  } catch (error) {
    console.error('Create activity error:', error);
    return res.status(500).json({ message: 'Server error during activity creation.' });
  }
});

// PUT /api/activities/:id (Admin only)
router.put('/:id', authMiddleware, requireAdmin, upload.array('files', 5), (req, res) => {
  const { id } = req.params;
  const activity = ActivityDb.findById(id);

  if (!activity) {
    return res.status(404).json({ message: 'Activity record not found.' });
  }

  const { title, description, activityDate, images, videos } = req.body;
  const updates: Partial<Activity> = {};

  if (title) updates.title = title;
  if (description) updates.description = description;
  if (activityDate) updates.activityDate = activityDate;

  // Process newly uploaded files
  const fileImages: string[] = [];
  const fileVideos: string[] = [];
  const files = req.files as Express.Multer.File[];
  
  if (files && files.length > 0) {
    files.forEach(file => {
      const relativePath = `/uploads/${file.filename}`;
      if (file.mimetype.startsWith('video/')) {
        fileVideos.push(relativePath);
      } else {
        fileImages.push(relativePath);
      }
    });
  }

  // Parse existing files or custom strings
  let finalImages = activity.images;
  let finalVideos = activity.videos;

  if (images !== undefined) {
    finalImages = Array.isArray(images) ? images : [images];
  }
  if (videos !== undefined) {
    finalVideos = Array.isArray(videos) ? videos : [videos];
  }

  updates.images = [...finalImages, ...fileImages];
  updates.videos = [...finalVideos, ...fileVideos];

  try {
    const updatedActivity = ActivityDb.findByIdAndUpdate(id, updates);
    return res.json(updatedActivity);
  } catch (error) {
    console.error('Update activity error:', error);
    return res.status(500).json({ message: 'Server error during activity update.' });
  }
});

// DELETE /api/activities/:id (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const activity = ActivityDb.findById(id);

  if (!activity) {
    return res.status(404).json({ message: 'Activity not found.' });
  }

  try {
    ActivityDb.findByIdAndDelete(id);
    
    // Clean up local files if they are in the uploads folder
    const allFiles = [...activity.images, ...activity.videos];
    allFiles.forEach(fileUrl => {
      if (fileUrl.startsWith('/uploads/')) {
        const filename = fileUrl.replace('/uploads/', '');
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    return res.json({ message: 'Activity record and associated media deleted successfully.' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({ message: 'Server error during activity deletion.' });
  }
});

export default router;
