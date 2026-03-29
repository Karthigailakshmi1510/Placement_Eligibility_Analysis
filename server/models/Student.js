import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  technologies: [String],
  link: String,
}, { _id: true });

const internshipSchema = new mongoose.Schema({
  companyName: String,
  role: String,
  duration: String,
  description: String,
}, { _id: true });

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  collegeName: { type: String, default: '' },
  cgpa: { type: Number, required: true },
  skills: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  projects: { type: [projectSchema], default: [] },
  internships: { type: [internshipSchema], default: [] },
  isRegistered: { type: Boolean, default: false },
  placementStatus: { type: String, enum: ['placed', 'not_placed'], default: 'not_placed' },
}, { timestamps: true });

studentSchema.index({ department: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
