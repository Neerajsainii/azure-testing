function getAcademicYearInfo(inputDate = new Date()) {
  const d = new Date(inputDate)
  const year = d.getFullYear()
  const month = d.getMonth() + 1

  // Academic cycle starts in July.
  const startYear = month >= 7 ? year : year - 1
  const endYear = startYear + 1

  return {
    startYear,
    endYear,
    label: `${startYear}-${String(endYear).slice(-2)}`,
  }
}

function getCurrentBatches(inputDate = new Date()) {
  const { endYear } = getAcademicYearInfo(inputDate)
  // 4-year UG default graduation windows.
  return [endYear, endYear + 1, endYear + 2]
}

module.exports = {
  getAcademicYearInfo,
  getCurrentBatches,
}
