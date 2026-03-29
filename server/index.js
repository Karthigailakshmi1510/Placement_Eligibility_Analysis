import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import User from './models/User.js';
import { hashPassword } from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_eligibility';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_) {}

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

async function seedAdmin() {
  const exists = await User.findOne({ role: 'admin' });
  if (exists) return;
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await User.create({
    username: 'admin',
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  console.log('Default admin created: username=admin, password=' + password);
}

mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  return seedAdmin();
}).then(() => {
  app.listen(PORT, () => console.log('Server running on port', PORT));
}).catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
