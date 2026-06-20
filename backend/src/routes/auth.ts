import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserDb, User } from '../models/db';
import { authMiddleware, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'healthcare_training_jwt_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'healthcare_training_jwt_refresh_secret_key_2026';

// Helper to generate tokens
function generateTokens(user: User) {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id, role: user.role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  // Check email conflict
  const existingUser = UserDb.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = UserDb.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = UserDb.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; role: 'admin' | 'user' };
    const user = UserDb.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Invalid user session or deactivated account.' });
    }

    const accessToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const user = UserDb.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive
  });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const { name, email, phone, currentPassword, newPassword } = req.body;

  const user = UserDb.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Email conflict check
  if (email && email !== user.email) {
    const conflict = UserDb.findOne({ email });
    if (conflict) {
      return res.status(409).json({ message: 'Email address is already in use.' });
    }
  }

  try {
    const updates: Partial<User> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password || '');
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }

      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = UserDb.findByIdAndUpdate(user._id, updates);
    if (!updatedUser) {
      return res.status(500).json({ message: 'Could not update profile.' });
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error during profile update.' });
  }
});

// Admin-only User management routes (Part of Super Admin role)
// GET /api/users (Admin only)
router.get('/users', authMiddleware, requireAdmin, (req, res) => {
  const users = UserDb.find();
  const safeUsers = users.map(u => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt
  }));
  return res.json(safeUsers);
});

// PUT /api/users/:id/toggle-active (Admin only)
router.put('/users/:id/toggle-active', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = UserDb.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const updated = UserDb.findByIdAndUpdate(id, { isActive: !user.isActive });
  return res.json({ message: `User status updated to ${updated?.isActive ? 'active' : 'inactive'}.`, user: updated });
});

// DELETE /api/users/:id (Admin only)
router.delete('/users/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // Protect self deletion
  const reqUser = (req as AuthenticatedRequest).user;
  if (reqUser && reqUser.id === id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  const user = UserDb.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  UserDb.findByIdAndDelete(id);
  return res.json({ message: 'User account deleted successfully.' });
});

export default router;
