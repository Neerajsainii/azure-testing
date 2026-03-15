const { atsScore, jobMatch, projectEvaluator, extractSkills } = require('../index')
async function main() {
  const resumeText = 'Senior developer skilled in Node.js, React, MongoDB, Docker.'
  const jobDescription = 'Backend Engineer with Node.js and MongoDB'
  const projectText = 'Title: API Service\nDescription: Built scalable REST APIs with Node.js and MongoDB.\nTech: Node.js, MongoDB, Docker'
  const ats = await atsScore({ resumeText, jobDescription, dryRun: true })
  const match = await jobMatch({ resumeText, jobDescription, dryRun: true })
  const proj = await projectEvaluator({ projectText, jobDescription, dryRun: true })
  const skills = await extractSkills({ resumeText, jobDescription, dryRun: true })
  console.log('ATS:', ats)
  console.log('Match:', match)
  console.log('Project:', proj)
  console.log('Skills:', skills)
}
main().catch(e => { console.error(e); process.exit(1) })
