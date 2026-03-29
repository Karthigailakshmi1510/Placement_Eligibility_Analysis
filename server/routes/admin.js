import express from 'express';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import Student from '../models/Student.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Eligibility from '../models/Eligibility.js';
import Resume from '../models/Resume.js';
import { hashPassword } from '../models/User.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { checkEligibility } from '../utils/eligibility.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireAdmin);

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
];

function generateUsername(name, department) {
  const base = name.replace(/\s+/g, '').toLowerCase().slice(0, 8);
  const deptCode = department.replace(/\s+/g, '').slice(0, 2).toLowerCase();
  return `${base}_${deptCode}_${Date.now().toString(36)}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ department: 1, name: 1 }).lean();
    const resumeStudentIds = new Set(
      (await Resume.find({}, 'studentId').lean()).map((r) => r.studentId.toString())
    );
    const studentIds = students.map((s) => s._id);
    const users = await User.find({ role: 'student', studentId: { $in: studentIds } })
      .select('studentId username initialPassword')
      .lean();
    const userByStudentId = Object.fromEntries(
      users.map((u) => [u.studentId.toString(), { username: u.username, password: u.initialPassword }])
    );
    const list = students.map((s) => {
      const creds = userByStudentId[s._id.toString()];
      return {
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        department: s.department,
        collegeName: s.collegeName || '',
        cgpa: s.cgpa,
        skills: s.skills || [],
        certifications: s.certifications || [],
        resumeUrl: resumeStudentIds.has(s._id.toString()) ? '/api/student/resume' : undefined,
        projects: s.projects || [],
        internships: s.internships || [],
        isRegistered: s.isRegistered,
        placementStatus: s.placementStatus,
        createdAt: s.createdAt,
        username: creds?.username,
        password: creds?.password,
      };
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { name, email, department, collegeName, cgpa } = req.body;
    const cgpaNum = Number(cgpa);
    if (!name || !email || !department || cgpa === undefined || cgpa === '' || isNaN(cgpaNum)) {
      return res.status(400).json({ error: 'Name, email, department and CGPA are required' });
    }
    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ error: 'Invalid department' });
    }
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Student with this email already exists' });

    const student = await Student.create({
      name,
      email,
      department,
      collegeName: collegeName || '',
      cgpa: cgpaNum,
      skills: [],
      certifications: [],
      projects: [],
      internships: [],
      isRegistered: false,
      placementStatus: 'not_placed',
    });

    const username = generateUsername(name, department);
    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);

    await User.create({
      username,
      passwordHash,
      role: 'student',
      studentId: student._id,
      initialPassword: plainPassword,
    });

    return res.status(201).json({
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        department: student.department,
        collegeName: student.collegeName,
        cgpa: student.cgpa,
        skills: student.skills,
        certifications: student.certifications,
        projects: student.projects,
        internships: student.internships,
        isRegistered: student.isRegistered,
        placementStatus: student.placementStatus,
        createdAt: student.createdAt,
      },
      credentials: { username, password: plainPassword },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/generate-credentials', async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const studentObjId = student._id;
    let user = await User.findOne({ role: 'student', studentId: studentObjId }).lean();
    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);
    if (!user) {
      const username = generateUsername(student.name, student.department);
      await User.create({
        username,
        passwordHash,
        role: 'student',
        studentId: studentObjId,
        initialPassword: plainPassword,
      });
      return res.status(201).json({
        credentials: { username, password: plainPassword },
        message: 'Credentials generated. Share with the student.',
      });
    }
    const username = user.username;
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      initialPassword: plainPassword,
    });
    return res.json({
      credentials: { username, password: plainPassword },
      message: 'Password reset. Share with the student.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/students/:id/placement-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { placementStatus } = req.body;
    if (!['placed', 'not_placed'].includes(placementStatus)) {
      return res.status(400).json({ error: 'Invalid placement status' });
    }
    const student = await Student.findByIdAndUpdate(
      id,
      { placementStatus },
      { new: true }
    ).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json({ placementStatus: student.placementStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/students/:id/eligibility', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await Eligibility.find({ studentId: id })
      .populate('driveId')
      .lean();
    return res.json(records.map((r) => ({
      driveId: r.driveId?._id?.toString(),
      status: r.status,
      reasons: r.reasons,
      missingSkills: r.missingSkills,
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/students/:id/re-evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const drives = await PlacementDrive.find().lean();
    for (const drive of drives) {
      const result = checkEligibility(student, drive);
      await Eligibility.findOneAndUpdate(
        { studentId: id, driveId: drive._id },
        {
          status: result.status,
          reasons: result.reasons,
          missingSkills: result.missingSkills || [],
        },
        { upsert: true, new: true }
      );
    }
    const updated = await Eligibility.find({ studentId: id }).lean();
    return res.json(updated.map((r) => ({
      driveId: r.driveId.toString(),
      status: r.status,
      reasons: r.reasons,
      missingSkills: r.missingSkills,
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/eligibility/:studentId/:driveId', async (req, res) => {
  try {
    const { studentId, driveId } = req.params;
    const { status } = req.body;
    if (!['eligible', 'not_eligible', 'not_registered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid eligibility status' });
    }
    const rec = await Eligibility.findOneAndUpdate(
      { studentId, driveId },
      { status, reasons: [], missingSkills: [] },
      { upsert: true, new: true }
    ).lean();
    return res.json({ driveId: rec.driveId.toString(), status: rec.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/drives', async (req, res) => {
  try {
    const drives = await PlacementDrive.find().sort({ createdAt: -1 }).lean();
    return res.json(drives.map((d) => ({
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
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/drives', async (req, res) => {
  try {
    const drive = await PlacementDrive.create(req.body);
    return res.status(201).json({
      id: drive._id.toString(),
      companyName: drive.companyName,
      driveLink: drive.driveLink,
      minCgpa: drive.minCgpa,
      requiredSkills: drive.requiredSkills,
      eligibleDepartments: drive.eligibleDepartments,
      description: drive.description,
      deadline: drive.deadline,
      salary: drive.salary,
      createdAt: drive.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/pdf/registered', async (req, res) => {
  try {
    const students = await Student.find({ isRegistered: true })
      .sort({ department: 1, name: 1 })
      .lean();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=registered-students.pdf');
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('Registered Students', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);
    students.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.name} - ${s.email} - ${s.department} - CGPA: ${s.cgpa}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/pdf/eligible', async (req, res) => {
  try {
    let driveId = req.query.driveId;
    if (!driveId) {
      const first = await PlacementDrive.findOne().sort({ createdAt: -1 }).lean();
      if (!first) return res.status(400).json({ error: 'No drives found' });
      driveId = first._id.toString();
    }
    const records = await Eligibility.find({ driveId, status: 'eligible' })
      .populate('studentId')
      .lean();
    const students = records.map((r) => r.studentId).filter(Boolean);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=eligible-students.pdf');
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('Eligible Students (Drive)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);
    students.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.name} - ${s.email} - ${s.department} - CGPA: ${s.cgpa}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/students/:id/resume', async (req, res) => {
  try {
    const resume = await Resume.findOne({ studentId: req.params.id }).lean();
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

export default router;
