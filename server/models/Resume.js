import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  path: { type: String, required: true },
  size: Number,
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
