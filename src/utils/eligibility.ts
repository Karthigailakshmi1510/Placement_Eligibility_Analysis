import { Student, PlacementDrive, EligibilityResult } from '@/types';

export const checkEligibility = (student: Student, drive: PlacementDrive): EligibilityResult => {
  const reasons: string[] = [];
  const missingSkills: string[] = [];

  // Check if student is registered
  if (!student.isRegistered) {
    return {
      status: 'not_registered',
      reasons: ['You have not completed your registration. Please update your profile to check eligibility.'],
      missingSkills: [],
    };
  }

  // Check CGPA
  if (student.cgpa < drive.minCgpa) {
    reasons.push(`CGPA (${student.cgpa}) is below the required minimum (${drive.minCgpa})`);
  }

  // Check skills
  const studentSkillsLower = student.skills.map(s => s.toLowerCase());
  drive.requiredSkills.forEach(skill => {
    if (!studentSkillsLower.includes(skill.toLowerCase())) {
      missingSkills.push(skill);
    }
  });

  if (missingSkills.length > 0) {
    reasons.push(`Missing required skills: ${missingSkills.join(', ')}`);
  }

  // Check department
  if (!drive.eligibleDepartments.includes(student.department)) {
    reasons.push(`Your department (${student.department}) is not eligible for this drive`);
  }

  if (reasons.length > 0) {
    return {
      status: 'not_eligible',
      reasons,
      missingSkills,
    };
  }

  return {
    status: 'eligible',
    reasons: [],
    missingSkills: [],
    driveLink: drive.driveLink,
  };
};

export const getEligibilityMessage = (result: EligibilityResult, driveLink?: string): string => {
  switch (result.status) {
    case 'eligible':
      return `You are eligible for this placement drive. Apply using the following link: ${driveLink}`;
    case 'not_eligible':
      return `You are not eligible for this placement drive due to the following reason(s):\n${result.reasons.map(r => `• ${r}`).join('\n')}`;
    case 'not_registered':
      return result.reasons[0];
    default:
      return '';
  }
};
