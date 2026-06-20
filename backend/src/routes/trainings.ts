import { Router } from 'express';
import { TrainingDb, Training, RegistrationDb } from '../models/db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/trainings (Public)
router.get('/', (req, res) => {
  const trainings = TrainingDb.find();
  
  // Verify date statuses in real-time
  const now = new Date().toISOString().split('T')[0];
  const updatedTrainings = trainings.map(training => {
    let status = training.status;
    
    // Auto-close if deadline passed or training started
    if (training.registrationDeadline < now || training.startDate <= now) {
      if (status !== 'closed') {
        status = 'closed';
        TrainingDb.findByIdAndUpdate(training._id, { status: 'closed' });
      }
    } else if (training.registeredCount >= training.participantLimit) {
      if (status !== 'full') {
        status = 'full';
        TrainingDb.findByIdAndUpdate(training._id, { status: 'full' });
      }
    } else {
      if (status === 'full' && training.registeredCount < training.participantLimit) {
        status = 'open';
        TrainingDb.findByIdAndUpdate(training._id, { status: 'open' });
      }
    }
    return { ...training, status };
  });

  return res.json(updatedTrainings);
});

// GET /api/trainings/:id (Public)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const training = TrainingDb.findById(id);
  
  if (!training) {
    return res.status(404).json({ message: 'Training program not found.' });
  }

  // Update status if needed
  const now = new Date().toISOString().split('T')[0];
  let status = training.status;
  if (training.registrationDeadline < now || training.startDate <= now) {
    status = 'closed';
  } else if (training.registeredCount >= training.participantLimit) {
    status = 'full';
  } else if (status === 'full') {
    status = 'open';
  }

  if (status !== training.status) {
    TrainingDb.findByIdAndUpdate(id, { status });
    training.status = status;
  }

  return res.json(training);
});

// POST /api/trainings (Admin only)
router.post('/', authMiddleware, requireAdmin, (req, res) => {
  const { title, description, trainer, venue, startDate, endDate, registrationDeadline, participantLimit } = req.body;

  if (!title || !description || !trainer || !venue || !startDate || !endDate || !registrationDeadline || !participantLimit) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const limitNum = parseInt(participantLimit, 10);
  if (isNaN(limitNum) || limitNum <= 0) {
    return res.status(400).json({ message: 'Participant limit must be a positive number.' });
  }

  const now = new Date().toISOString().split('T')[0];
  let initialStatus: 'open' | 'closed' = 'open';

  if (registrationDeadline < now || startDate <= now) {
    initialStatus = 'closed';
  }

  try {
    const newTraining = TrainingDb.create({
      title,
      description,
      trainer,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      participantLimit: limitNum,
      registeredCount: 0,
      status: initialStatus
    });

    return res.status(201).json(newTraining);
  } catch (error) {
    console.error('Create training error:', error);
    return res.status(500).json({ message: 'Server error during training creation.' });
  }
});

// PUT /api/trainings/:id (Admin only)
router.put('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const training = TrainingDb.findById(id);

  if (!training) {
    return res.status(404).json({ message: 'Training not found.' });
  }

  const { title, description, trainer, venue, startDate, endDate, registrationDeadline, participantLimit, status } = req.body;

  const updates: Partial<Training> = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (trainer) updates.trainer = trainer;
  if (venue) updates.venue = venue;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (registrationDeadline) updates.registrationDeadline = registrationDeadline;

  if (participantLimit !== undefined) {
    const limitNum = parseInt(participantLimit, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ message: 'Participant limit must be a positive number.' });
    }
    updates.participantLimit = limitNum;

    // Check count and status alignment
    if (training.registeredCount >= limitNum) {
      updates.status = 'full';
    } else if (training.status === 'full' && training.registeredCount < limitNum) {
      updates.status = 'open';
    }
  }

  // Explicit status override from admin
  if (status && ['open', 'full', 'closed'].includes(status)) {
    updates.status = status;
  }

  try {
    const updatedTraining = TrainingDb.findByIdAndUpdate(id, updates);
    return res.json(updatedTraining);
  } catch (error) {
    console.error('Update training error:', error);
    return res.status(500).json({ message: 'Server error during training update.' });
  }
});

// DELETE /api/trainings/:id (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const training = TrainingDb.findById(id);

  if (!training) {
    return res.status(404).json({ message: 'Training not found.' });
  }

  try {
    TrainingDb.findByIdAndDelete(id);

    // Also delete associated registrations & certificates to maintain database integrity
    const registrations = RegistrationDb.find({ training: id });
    registrations.forEach(reg => {
      RegistrationDb.findByIdAndDelete(reg._id);
    });

    return res.json({ message: 'Training program and associated registration records deleted successfully.' });
  } catch (error) {
    console.error('Delete training error:', error);
    return res.status(500).json({ message: 'Server error during training deletion.' });
  }
});

export default router;
