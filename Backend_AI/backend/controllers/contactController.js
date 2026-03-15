
const ContactQuery = require("../models/ContactQuery");
const { logger } = require("../utils/logger");

exports.createContactQuery = async (req, res) => {
  try {
    const { name, email, college, message } = req.body || {}
    const query = await ContactQuery.create({
      name,
      email,
      college: college || null,
      message,
    })
    logger.info("contact_query_received", { id: query._id.toString(), email })

    return res.status(201).json({ message: "Query received. We will get back to you soon." })
  } catch (error) {
    logger.error("contact_query_failed", { message: error.message })
    return res.status(500).json({ message: "Failed to submit query" })
  }
};

exports.listContactQueries = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query?.limit) || 50, 100)
    const page = Math.max(Number(req.query?.page) || 1, 1)
    const status = req.query?.status

    const filter = {}
    if (status) filter.status = status

    const [queries, total] = await Promise.all([
      ContactQuery.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactQuery.countDocuments(filter),
    ])

    return res.status(200).json({
      queries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("contact_query_list_failed", { message: error.message })
    return res.status(500).json({ message: "Failed to fetch queries" })
  }
};
