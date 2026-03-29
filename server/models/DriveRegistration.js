import mongoose from 'mongoose';

const driveRegistrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

driveRegistrationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

const DriveRegistration = mongoose.model('DriveRegistration', driveRegistrationSchema);
export default DriveRegistration;
