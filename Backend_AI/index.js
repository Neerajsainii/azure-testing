module.exports = {
  atsScore: require('./ai/atsScore').atsScore,
  jobMatch: require('./ai/jobMatch').jobMatch,
  jobMatchBatch: require('./ai/jobMatch').jobMatchBatch,
  projectEvaluator: require('./ai/projectEvaluator').projectEvaluator,
  extractSkills: require('./ai/skillExtractor').extractSkills,
  profileAnalysis: require('./ai/skillExtractor').profileAnalysis
}
