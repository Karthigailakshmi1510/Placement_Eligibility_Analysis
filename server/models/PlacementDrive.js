import mongoose from 'mongoose';

const driveSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  driveLink: { type: String, required: true },
  companyLogo: String,
  minCgpa: { type: Number, required: true },
  requiredSkills: { type: [String], default: [] },
  eligibleDepartments: { type: [String], default: [] },
  description: { type: String, default: '' },
  deadline: { type: Date, required: true },
  salary: String,
}, { timestamps: true });

const PlacementDrive = mongoose.model('PlacementDrive', driveSchema);
export default PlacementDrive;
