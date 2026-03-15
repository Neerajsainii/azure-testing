
const mongoose = require("mongoose");

const ContactQuerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    college: { type: String, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactQuery", ContactQuerySchema);
