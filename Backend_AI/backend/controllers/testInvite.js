require("dotenv").config();
const mongoose = require("mongoose");
const env = require("../config/env");

async function testHODInvite() {
    await mongoose.connect(env.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to DB");

    const User = require("../models/User");
    const Department = require("../models/Department");
    const InviteController = require("./inviteController");

    // Find an HOD
    const hod = await User.findOne({ role: "HOD" }).lean();
    if (!hod) {
        console.log("No HOD found in the DB. Cannot test HOD invite.");
        process.exit(1);
    }

    console.log("Found HOD:", hod.email, "in department", hod.department);

    // Mock req and res
    const req = {
        user: hod,
        body: {
            email: "test.student.hod.invite@example.com",
            name: "Test Student HOD",
            department: hod.department || "CSE",
            year: "4",
            batch: "2024",
        },
        requestId: "test-req-123"
    };

    const res = {
        statusCode: null,
        jsonData: null,
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            this.jsonData = data;
            console.log("Response:", this.statusCode, JSON.stringify(data, null, 2));
        }
    };

    console.log("Simulating inviteStudent...");
    try {
        await InviteController.inviteStudent(req, res);
    } catch (err) {
        console.error("Uncaught error:", err);
    }

    process.exit(res.statusCode === 201 ? 0 : 1);
}

testHODInvite();
