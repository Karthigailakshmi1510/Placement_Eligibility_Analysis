import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Resume from '../models/Resume.js';
import { verifyPassword } from '../models/User.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username, role: 'admin' });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ id: user._id.toString(), role: 'admin' });
    return res.json({ token, role: 'admin' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/student/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username, role: 'student' }).populate('studentId');
    if (!user || !user.studentId || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const student = await Student.findById(user.studentId).lean();
    const token = signToken({
      id: user._id.toString(),
      role: 'student',
      studentId: user.studentId._id.toString(),
    });
    const hasResume = await Resume.exists({ studentId: user.studentId._id });
    return res.json({
      token,
      role: 'student',
      student: formatStudent(student, user.studentId._id.toString(), !!hasResume, user.username, user.initialPassword),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ role: 'admin' });
    }
    const user = await User.findById(req.user.id).populate('studentId');
    if (!user?.studentId) return res.status(404).json({ error: 'Student not found' });
    const student = await Student.findById(user.studentId).lean();
    const hasResume = await Resume.exists({ studentId: user.studentId._id });
    return res.json({
      role: 'student',
      student: formatStudent(student, user.studentId._id.toString(), !!hasResume, user.username, user.initialPassword),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

function formatStudent(doc, id, hasResume = false, username = null, password = null) {
  if (!doc) return null;
  return {
    id,
    name: doc.name,
    email: doc.email,
    department: doc.department,
    collegeName: doc.collegeName || '',
    cgpa: doc.cgpa,
    skills: doc.skills || [],
    certifications: doc.certifications || [],
    resumeUrl: hasResume ? '/api/student/resume' : undefined,
    projects: doc.projects || [],
    internships: doc.internships || [],
    isRegistered: doc.isRegistered,
    placementStatus: doc.placementStatus,
    createdAt: doc.createdAt,
    username: username ?? undefined,
    password: password ?? undefined,
  };
}

export default router;
