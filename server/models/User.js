import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  /** Stored so admin and student can view later (student login credentials) */
  initialPassword: { type: String, default: null },
}, { timestamps: true });

userSchema.index({ username: 1, role: 1 });

const User = mongoose.model('User', userSchema);
export default User;

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
