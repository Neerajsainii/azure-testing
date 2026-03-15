require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function getToken() {
    await mongoose.connect(env.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const hod = await User.findOne({ role: "HOD" }).lean();
    if (!hod) {
        console.log("No HOD found.");
        process.exit(1);
    }

    const token = jwt.sign(
        { id: hod._id, email: hod.email, role: hod.role },
        env.jwtSecret,
        { expiresIn: "1h" }
    );

    console.log("HOD_EMAIL:", hod.email);
    console.log("HOD_TOKEN:", token);
    process.exit(0);
}

getToken();
