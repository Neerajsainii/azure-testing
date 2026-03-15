const { getPrincipalAnalytics } = require("../services/reportService")
const { logger } = require("../utils/logger")

exports.getDepartmentPerformance = async (req, res) => {
  try {
    const data = await getPrincipalAnalytics(req.user)
    return res.json(data.departmentPerformance)
  } catch (error) {
    logger.error("principal_department_performance_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch department performance" })
  }
}

exports.getPlacementOverview = async (req, res) => {
  try {
    const data = await getPrincipalAnalytics(req.user)
    return res.json(data.placementOverview)
  } catch (error) {
    logger.error("principal_placement_overview_failed", { requestId: req.requestId || null, message: error.message })
    return res.status(500).json({ message: "Failed to fetch placement overview" })
  }
}

exports.getBatchWise = async (req, res) => {
  try {
    const data = await getPrincipalAnalytics(req.user)
    return res.json(data.batchWise)
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch batch analytics" })
  }
}

exports.getCompanyWise = async (req, res) => {
  try {
    const data = await getPrincipalAnalytics(req.user)
    return res.json(data.companyWise)
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch company analytics" })
  }
}

exports.getComparison = async (req, res) => {
  try {
    const data = await getPrincipalAnalytics(req.user)
    return res.json(data.comparison)
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch comparison analytics" })
  }
}
