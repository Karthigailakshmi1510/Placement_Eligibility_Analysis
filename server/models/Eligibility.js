import mongoose from 'mongoose';

// Eligibility is set only by Admin. Student profile updates do NOT change this.
const eligibilitySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  status: { type: String, enum: ['eligible', 'not_eligible', 'not_registered'], required: true },
  reasons: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
}, { timestamps: true });

eligibilitySchema.index({ studentId: 1, driveId: 1 }, { unique: true });

const Eligibility = mongoose.model('Eligibility', eligibilitySchema);
export default Eligibility;
