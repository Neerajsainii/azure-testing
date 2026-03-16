module.exports = (resume) => {
  const missing = [];

  if (!resume.personalInfo?.fullName) missing.push("Full Name");
  if (!resume.education?.length) missing.push("Education");
  if (!resume.skills?.length) missing.push("Skills");
  if (!resume.projects?.length) missing.push("Projects");
  if (!resume.selectedTemplate) missing.push("Template");

  const total = 5;
  const completion = Math.round(((total - missing.length) / total) * 100);

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
    completion
  };
};
