require('dotenv').config();
const mongoose = require("mongoose");
const env = require("../config/env");

mongoose.connect(env.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to DB");
        const User = require("../models/User");
        const College = require("../models/College");

        const principals = await User.find({ role: "PRINCIPAL", collegeName: { $ne: null }, collegeId: null });
        console.log(`Found ${principals.length} principals with missing collegeId.`);

        for (const p of principals) {
            if (p.collegeName) {
                const college = await College.findOne({ name: { $regex: new RegExp(`^${p.collegeName.trim().replace(/[.*+?^${}()|[\]\\\\]/g, "\\\\$&")}$`, "i") } });
                if (college) {
                    p.collegeId = college._id;
                    await p.save();
                    console.log(`Updated principal ${p.email} with collegeId ${college._id}`);
                } else {
                    console.log(`College '${p.collegeName}' not found for principal ${p.email}`);
                }
            }
        }
        console.log("Done.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
