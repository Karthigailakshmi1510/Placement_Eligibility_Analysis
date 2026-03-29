/**
 * Eligibility is calculated only when Admin re-evaluates.
 * Student profile updates do NOT trigger this.
 */
export function checkEligibility(student, drive) {
  const reasons = [];
  const missingSkills = [];

  if (!student.isRegistered) {
    return {
      status: 'not_registered',
      reasons: ['Student has not completed registration.'],
      missingSkills: [],
    };
  }

  if (student.cgpa < drive.minCgpa) {
    reasons.push(`CGPA (${student.cgpa}) is below the required minimum (${drive.minCgpa})`);
  }

  const studentSkillsLower = (student.skills || []).map((s) => s.toLowerCase());
  (drive.requiredSkills || []).forEach((skill) => {
    if (!studentSkillsLower.includes(skill.toLowerCase())) {
      missingSkills.push(skill);
    }
  });

  if (missingSkills.length > 0) {
    reasons.push(`Missing required skills: ${missingSkills.join(', ')}`);
  }

  if (!(drive.eligibleDepartments || []).includes(student.department)) {
    reasons.push(`Department (${student.department}) is not eligible for this drive`);
  }

  if (reasons.length > 0) {
    return { status: 'not_eligible', reasons, missingSkills };
  }

  return { status: 'eligible', reasons: [], missingSkills: [] };
}
