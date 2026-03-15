
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const principals = await User.find({ role: "principal" }).lean();
    console.log("--- PRINCIPALS ---", principals.length);
    for (const p of principals) {
      console.log(`Email: ${p.email} | CollegeId: ${p.collegeId} | Status: ${p.status}`);
      if (p.collegeId) {
        const studentCount = await User.countDocuments({ role: "student", collegeId: p.collegeId });
        console.log(`  -> Students with this collegeId: ${studentCount}`);

        // Exact getStudentRecords query
        const pipeline = [
          { $match: { role: "student", collegeId: p.collegeId } },
          {
            $lookup: {
              from: "resumes",
              localField: "_id",
              foreignField: "userId",
              as: "resume"
            }
          },
          { $unwind: { path: "$resume", preserveNullAndEmptyArrays: true } }
        ];
        const matchStudents = await User.aggregate(pipeline);
        console.log(`  -> Pipeline match count: ${matchStudents.length}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();

