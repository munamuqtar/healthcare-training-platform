import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load Environment Configuration
dotenv.config();

import authRouter from './routes/auth';
import trainingsRouter from './routes/trainings';
import registrationsRouter from './routes/registrations';
import activitiesRouter from './routes/activities';
import newsRouter from './routes/news';
import certificatesRouter from './routes/certificates';
import { seedDatabase } from './models/db';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded static files
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Mount REST API routers
app.use('/api/auth', authRouter);
app.use('/api/trainings', trainingsRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/news', newsRouter);
app.use('/api/certificates', certificatesRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred.'
  });
});

// Boot Server and Seed Database
async function startServer() {
  try {
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Healthcare Training Server Running on Port ${PORT}`);
      console.log(`📂 Serving static uploads from: ${uploadsPath}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
