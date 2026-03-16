const Company = require("../models/Company");
const logAudit = require("../utils/auditLogger");
const { ROLES } = require("../constants/roles")
const { logger } = require("../utils/logger")

// Create Company
exports.createCompany = async (req, res) => {
  try {
    const { name, criteria, description } = req.body;
    const collegeId = req.user?.collegeId;

    if (!collegeId) {
      return res.status(400).json({ message: "User is not associated with a college" });
    }

    // Duplicate check scoped to this college
    const existingCompany = await Company.findOne({ name, collegeId });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists for this college" });
    }

    const newCompany = new Company({
      name,
      collegeId,
      description: description || "",
      criteria,
      createdBy: req.user._id
    });

    await newCompany.save();

    await logAudit(req.user, "CREATE_COMPANY", "company", newCompany._id, req);

    res.status(201).json(newCompany);
  } catch (error) {
    logger.error("company_create_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// List Companies — scoped to the user's college
exports.listCompanies = async (req, res) => {
  try {
    const collegeId = req.user?.collegeId;

    const filter = collegeId ? { collegeId } : {};

    const companies = await Company.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 });

    if (req.user && req.user.role === ROLES.PLATFORM_ADMIN) {
      await logAudit(req.user, "VIEW_COMPANIES", "company", null, req);
    }

    res.json(companies);
  } catch (error) {
    logger.error("company_list_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Company Details
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Ensure the company belongs to the user's college
    const collegeId = req.user?.collegeId;
    if (collegeId && company.collegeId && String(company.collegeId) !== String(collegeId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await logAudit(req.user, "VIEW_COMPANY_DETAILS", "company", company._id, req);

    res.json(company);
  } catch (error) {
    logger.error("company_get_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Ensure the company belongs to the user's college
    const collegeId = req.user?.collegeId;
    if (collegeId && company.collegeId && String(company.collegeId) !== String(collegeId)) {
      return res.status(403).json({ message: "Access denied: company does not belong to your college" });
    }

    await company.deleteOne();

    await logAudit(req.user, "DELETE_COMPANY", "company", company._id, req);

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    logger.error("company_delete_failed", { requestId: req.requestId || null, message: error.message })
    res.status(500).json({ message: "Server Error" });
  }
};
