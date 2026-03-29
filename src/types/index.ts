export type UserRole = 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  collegeName: string;
  cgpa: number;
  skills: string[];
  certifications: string[];
  resumeUrl?: string;
  projects: Project[];
  internships: Internship[];
  isRegistered: boolean;
  placementStatus: 'placed' | 'not_placed';
  createdAt: Date;
  /** Login credentials (stored for admin/student to view anytime) */
  username?: string;
  password?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Internship {
  id: string;
  companyName: string;
  role: string;
  duration: string;
  description: string;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  companyLogo?: string;
  driveLink: string;
  minCgpa: number;
  requiredSkills: string[];
  eligibleDepartments: string[];
  description: string;
  deadline: Date;
  salary?: string;
  createdAt: Date;
}

export interface EligibilityResult {
  status: 'eligible' | 'not_eligible' | 'not_registered';
  reasons: string[];
  missingSkills: string[];
  driveLink?: string;
}
