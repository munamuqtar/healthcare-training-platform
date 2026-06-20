import { Router, Response } from 'express';
import { RegistrationDb, TrainingDb, UserDb, CertificateDb, Registration } from '../models/db';
import { authMiddleware, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/registrations (Register for training - authenticated users)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { trainingId } = req.body;
  const userId = req.user?.id;

  if (!trainingId || !userId) {
    return res.status(400).json({ message: 'Training ID is required.' });
  }

  // Find training
  const training = TrainingDb.findById(trainingId);
  if (!training) {
    return res.status(404).json({ message: 'Training program not found.' });
  }

  // Check deadline & status
  const now = new Date().toISOString().split('T')[0];
  if (training.registrationDeadline < now || training.startDate <= now || training.status === 'closed') {
    return res.status(400).json({ message: 'Registration for this training has closed.' });
  }

  // Check duplicate registration
  const duplicate = RegistrationDb.findOne({ user: userId, training: trainingId });
  if (duplicate) {
    return res.status(409).json({ message: 'You have already registered for this training program.' });
  }

  // Check participant limit
  if (training.registeredCount >= training.participantLimit || training.status === 'full') {
    // Make sure status is updated to full
    if (training.status !== 'full') {
      TrainingDb.findByIdAndUpdate(trainingId, { status: 'full' });
    }
    return res.status(400).json({ message: 'Training registration is full. No available seats.' });
  }

  try {
    // Create registration
    const newReg = RegistrationDb.create({
      user: userId,
      training: trainingId,
      attendanceStatus: 'pending',
      completionStatus: 'ongoing',
      registeredAt: new Date().toISOString()
    });

    // Update count in training
    const newCount = training.registeredCount + 1;
    const updates: any = { registeredCount: newCount };
    
    if (newCount >= training.participantLimit) {
      updates.status = 'full';
    }

    TrainingDb.findByIdAndUpdate(trainingId, updates);

    return res.status(201).json({
      message: 'Registration successful!',
      registration: newReg
    });
  } catch (error) {
    console.error('Registration create error:', error);
    return res.status(500).json({ message: 'Server error during training registration.' });
  }
});

// GET /api/registrations/my (Get logged-in user registrations)
router.get('/my', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find all registrations for this user
  const registrations = RegistrationDb.find({ user: userId });

  // Map to populate training details
  const populated = registrations.map(reg => {
    const training = TrainingDb.findById(reg.training);
    return {
      ...reg,
      trainingDetail: training
    };
  });

  return res.json(populated);
});

// GET /api/registrations (Admin view all registrations)
router.get('/', authMiddleware, requireAdmin, (req, res) => {
  const registrations = RegistrationDb.find();

  // Populate user and training details
  const populated = registrations.map(reg => {
    const user = UserDb.findById(reg.user);
    const training = TrainingDb.findById(reg.training);
    
    return {
      ...reg,
      userDetail: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      } : null,
      trainingDetail: training ? {
        id: training._id,
        title: training.title,
        startDate: training.startDate,
        endDate: training.endDate,
        trainer: training.trainer,
        venue: training.venue
      } : null
    };
  });

  return res.json(populated);
});

// PUT /api/registrations/:id (Admin update attendance/completion status)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { attendanceStatus, completionStatus } = req.body;

  const registration = RegistrationDb.findById(id);
  if (!registration) {
    return res.status(404).json({ message: 'Registration record not found.' });
  }

  const updates: Partial<Registration> = {};
  if (attendanceStatus && ['pending', 'present', 'absent'].includes(attendanceStatus)) {
    updates.attendanceStatus = attendanceStatus;
  }

  let completedTriggered = false;
  if (completionStatus && ['ongoing', 'completed', 'failed'].includes(completionStatus)) {
    updates.completionStatus = completionStatus;
    
    // Check if transitioning to completed
    if (completionStatus === 'completed' && registration.completionStatus !== 'completed') {
      completedTriggered = true;
    }
  }

  try {
    const updatedReg = RegistrationDb.findByIdAndUpdate(id, updates);
    if (!updatedReg) {
      return res.status(500).json({ message: 'Error updating registration.' });
    }

    // Auto-generate certificate if marked completed
    if (completedTriggered) {
      // Check if certificate already exists
      const existingCert = CertificateDb.findOne({ user: registration.user, training: registration.training });
      if (!existingCert) {
        const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
        const stamp = Date.now().toString().slice(-4);
        const certNo = `CERT-${hash}-${stamp}`;

        CertificateDb.create({
          user: registration.user,
          training: registration.training,
          certificateNumber: certNo,
          issuedDate: new Date().toISOString()
        });
      }
    }

    // Retrieve fully populated updated registration to return
    const user = UserDb.findById(updatedReg.user);
    const training = TrainingDb.findById(updatedReg.training);

    return res.json({
      message: 'Participant registration status updated successfully.',
      registration: {
        ...updatedReg,
        userDetail: user ? {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        } : null,
        trainingDetail: training ? {
          id: training._id,
          title: training.title,
          startDate: training.startDate,
          endDate: training.endDate,
          trainer: training.trainer,
          venue: training.venue
        } : null
      }
    });
  } catch (error) {
    console.error('Registration update error:', error);
    return res.status(500).json({ message: 'Server error during status update.' });
  }
});

// DELETE /api/registrations/:id (Admin delete registration)
router.delete('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const registration = RegistrationDb.findById(id);

  if (!registration) {
    return res.status(404).json({ message: 'Registration record not found.' });
  }

  try {
    RegistrationDb.findByIdAndDelete(id);

    // Decrement registered count in training
    const training = TrainingDb.findById(registration.training);
    if (training) {
      const newCount = Math.max(0, training.registeredCount - 1);
      const updates: any = { registeredCount: newCount };
      
      // Re-open if below limit
      if (newCount < training.participantLimit && training.status === 'full') {
        const now = new Date().toISOString().split('T')[0];
        updates.status = training.registrationDeadline >= now && training.startDate > now ? 'open' : 'closed';
      }
      
      TrainingDb.findByIdAndUpdate(training._id, updates);
    }

    // Clean up certificate if it was generated
    const cert = CertificateDb.findOne({ user: registration.user, training: registration.training });
    if (cert) {
      CertificateDb.findByIdAndDelete(cert._id);
    }

    return res.json({ message: 'Registration deleted successfully and seat count updated.' });
  } catch (error) {
    console.error('Delete registration error:', error);
    return res.status(500).json({ message: 'Server error during registration deletion.' });
  }
});

export default router;
