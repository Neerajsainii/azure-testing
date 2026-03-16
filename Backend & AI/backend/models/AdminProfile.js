const mongoose = require("mongoose");

const AdminProfileSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            default: "Admin",
        },
        phone: {
            type: String,
            default: "",
        },
        alternateEmail: {
            type: String,
            default: "",
        },
        emergencyContact: {
            type: String,
            default: "",
        },
        designation: {
            type: String,
            default: "",
        },
        employeeId: {
            type: String,
            default: "",
        },
        tenure: {
            type: String,
            default: "",
        },
        department: {
            type: String,
            default: "",
        },
        office: {
            type: String,
            default: "",
        },
        officeHours: {
            type: String,
            default: "",
        },
        location: {
            type: String,
            default: "",
        },
        permissions: {
            type: String,
            default: "",
        },
        achievements: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("AdminProfile", AdminProfileSchema);
