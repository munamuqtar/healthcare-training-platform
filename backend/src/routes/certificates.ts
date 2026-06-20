import { Router, Response } from 'express';
import { CertificateDb, UserDb, TrainingDb } from '../models/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/certificates (Admin gets all, User gets their own)
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  let certificates = [];
  if (userRole === 'admin') {
    certificates = CertificateDb.find();
  } else {
    certificates = CertificateDb.find({ user: userId });
  }

  // Populate user and training details
  const populated = certificates.map(cert => {
    const user = UserDb.findById(cert.user);
    const training = TrainingDb.findById(cert.training);

    return {
      ...cert,
      userDetail: user ? {
        id: user._id,
        name: user.name,
        email: user.email
      } : null,
      trainingDetail: training ? {
        id: training._id,
        title: training.title,
        startDate: training.startDate,
        endDate: training.endDate,
        trainer: training.trainer
      } : null
    };
  });

  return res.json(populated);
});

// GET /api/certificates/:id (Get single certificate details)
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const cert = CertificateDb.findById(id);

  if (!cert) {
    return res.status(404).json({ message: 'Certificate not found.' });
  }

  // Permission check: User can only access their own certificate
  if (req.user?.role !== 'admin' && cert.user !== req.user?.id) {
    return res.status(403).json({ message: 'Access denied. You cannot view this certificate.' });
  }

  const user = UserDb.findById(cert.user);
  const training = TrainingDb.findById(cert.training);

  return res.json({
    ...cert,
    userDetail: user ? {
      id: user._id,
      name: user.name,
      email: user.email
    } : null,
    trainingDetail: training ? {
      id: training._id,
      title: training.title,
      startDate: training.startDate,
      endDate: training.endDate,
      trainer: training.trainer,
      venue: training.venue
    } : null
  });
});

// GET /api/certificates/:id/download (Return metadata for client PDF download)
router.get('/:id/download', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const cert = CertificateDb.findById(id);

  if (!cert) {
    return res.status(404).json({ message: 'Certificate not found.' });
  }

  // Check auth
  if (req.user?.role !== 'admin' && cert.user !== req.user?.id) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const user = UserDb.findById(cert.user);
  const training = TrainingDb.findById(cert.training);

  if (!user || !training) {
    return res.status(400).json({ message: 'Linked user or training records missing.' });
  }

  // Return download meta which frontend will render into PDF
  return res.json({
    certificateNumber: cert.certificateNumber,
    issuedDate: cert.issuedDate,
    recipientName: user.name,
    trainingTitle: training.title,
    trainerName: training.trainer,
    startDate: training.startDate,
    endDate: training.endDate,
    venue: training.venue,
    verificationUrl: `${req.protocol}://${req.get('host')}/verify/${cert.certificateNumber}`
  });
});

// GET /api/certificates/verify/:certNo (Public route to verify certificate code)
router.get('/verify/:certNo', (req, res) => {
  const { certNo } = req.params;
  const cert = CertificateDb.findOne({ certificateNumber: certNo });

  if (!cert) {
    return res.status(404).json({ verified: false, message: 'Invalid certificate number. Not found.' });
  }

  const user = UserDb.findById(cert.user);
  const training = TrainingDb.findById(cert.training);

  return res.json({
    verified: true,
    certificateNumber: cert.certificateNumber,
    issuedDate: cert.issuedDate,
    recipientName: user ? user.name : 'Unknown User',
    trainingTitle: training ? training.title : 'Unknown Training Program',
    trainerName: training ? training.trainer : 'N/A'
  });
});

export default router;
