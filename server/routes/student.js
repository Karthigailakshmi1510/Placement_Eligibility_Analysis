import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import User from '../models/User.js';
import Student from '../models/Student.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Eligibility from '../models/Eligibility.js';
import Resume from '../models/Resume.js';
import DriveRegistration from '../models/DriveRegistration.js';
import { authMiddleware, requireStudent } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireStudent);

const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'bin';
    cb(null, `${req.user.studentId}_${Date.now()}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF and DOC/DOCX files are allowed'));
  },
});

router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findById(req.user.studentId).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const hasResume = await Resume.exists({ studentId: student._id });
    const user = await User.findOne({ role: 'student', studentId: student._id })
      .select('username initialPassword')
      .lean();
    return res.json({
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      department: student.department,
      collegeName: student.collegeName || '',
      cgpa: student.cgpa,
      skills: student.skills || [],
      certifications: student.certifications || [],
      resumeUrl: hasResume ? '/api/student/resume' : undefined,
      projects: student.projects || [],
      internships: student.internships || [],
      isRegistered: student.isRegistered,
      placementStatus: student.placementStatus,
      createdAt: student.createdAt,
      username: user?.username,
      password: user?.initialPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const { skills, certifications, isRegistered } = req.body;
    const update = {};
    if (Array.isArray(skills)) update.skills = skills;
    if (Array.isArray(certifications)) update.certifications = certifications;
    if (typeof isRegistered === 'boolean') update.isRegistered = isRegistered;
    const student = await Student.findByIdAndUpdate(
      req.user.studentId,
      { $set: update },
      { new: true }
    ).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const user = await User.findOne({ role: 'student', studentId: student._id })
      .select('username initialPassword')
      .lean();
    const hasResume = await Resume.exists({ studentId: student._id });
    return res.json({
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      department: student.department,
      collegeName: student.collegeName || '',
      cgpa: student.cgpa,
      skills: student.skills || [],
      certifications: student.certifications || [],
      resumeUrl: hasResume ? '/api/student/resume' : undefined,
      projects: student.projects || [],
      internships: student.internships || [],
      isRegistered: student.isRegistered,
      placementStatus: student.placementStatus,
      createdAt: student.createdAt,
      username: user?.username,
      password: user?.initialPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/resume', (req, res, next) => {
  fs.mkdirSync(uploadDir, { recursive: true });
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const relativePath = path.relative(process.cwd(), req.file.path);
      await Resume.findOneAndUpdate(
        { studentId: req.user.studentId },
        {
          studentId: req.user.studentId,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          path: req.file.path,
          size: req.file.size,
        },
        { upsert: true, new: true }
      );
      await Student.findByIdAndUpdate(req.user.studentId, {
        resumeUrl: `/api/student/resume`,
      });
      return res.json({ success: true, message: 'Resume uploaded' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

router.get('/resume', async (req, res) => {
  try {
    const resume = await Resume.findOne({ studentId: req.user.studentId }).lean();
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    const filePath = path.isAbsolute(resume.path) ? resume.path : path.join(process.cwd(), resume.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', resume.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/drives-with-eligibility', async (req, res) => {
  try {
    const drives = await PlacementDrive.find().sort({ createdAt: -1 }).lean();
    const driveIds = drives.map((d) => d._id);
    const eligibilities = await Eligibility.find({
      studentId: req.user.studentId,
      driveId: { $in: driveIds },
    }).lean();
    const registrations = await DriveRegistration.find({
      studentId: req.user.studentId,
      driveId: { $in: driveIds },
    }).lean();
    const byDrive = Object.fromEntries(
      eligibilities.map((e) => [e.driveId.toString(), e])
    );
    const registeredDriveIds = new Set(registrations.map((r) => r.driveId.toString()));
    const list = drives.map((d) => {
      const e = byDrive[d._id.toString()];
      return {
        id: d._id.toString(),
        companyName: d.companyName,
        driveLink: d.driveLink,
        companyLogo: d.companyLogo,
        minCgpa: d.minCgpa,
        requiredSkills: d.requiredSkills || [],
        eligibleDepartments: d.eligibleDepartments || [],
        description: d.description,
        deadline: d.deadline,
        salary: d.salary,
        createdAt: d.createdAt,
        registered: registeredDriveIds.has(d._id.toString()),
        eligibility: e
          ? {
              status: e.status,
              reasons: e.reasons || [],
              missingSkills: e.missingSkills || [],
              driveLink: d.driveLink,
            }
          : { status: 'not_registered', reasons: [], missingSkills: [], driveLink: d.driveLink },
      };
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/drives/:driveId/register', async (req, res) => {
  try {
    const { driveId } = req.params;
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    const existing = await DriveRegistration.findOne({
      studentId: req.user.studentId,
      driveId,
    });
    if (existing) {
      return res.status(200).json({ message: 'Already registered', registered: true });
    }
    await DriveRegistration.create({
      studentId: req.user.studentId,
      driveId,
    });
    return res.status(201).json({ message: 'Registered for drive', registered: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
