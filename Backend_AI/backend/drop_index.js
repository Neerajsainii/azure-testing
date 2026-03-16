require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");

async function main() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Assign orphaned companies to a logical college
    const college = await mongoose.connection.collection('colleges').findOne({});
    if (college) {
        const result = await mongoose.connection.collection('companies').updateMany(
            { collegeId: { $exists: false } },
            { $set: { collegeId: college._id } }
        );
        console.log("Migrated orphaned companies to college", college.name, ":", result.modifiedCount);
    } else {
        console.log("No colleges found, skipping migration.");
    }

    // 2. Drop the legacy name_1 index
    try {
        await mongoose.connection.collection('companies').dropIndex('name_1');
        console.log("Dropped legacy name_1 index successfully.");
    } catch (e) {
        console.log("Legacy index name_1 drop skipped:", e.message);
    }

    // 3. Drop any bad compound indexes accidentally created
    try {
        await mongoose.connection.collection('companies').dropIndex('collegeId_1_name_1');
        console.log("Dropped compound index to let Mongoose rebuild it clean.");
    } catch (e) {
        // ignore
    }

    await mongoose.disconnect();
    console.log("Done.");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
