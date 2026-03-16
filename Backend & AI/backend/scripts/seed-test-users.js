require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const Department = require("../models/Department");
const StudentAcademicProfile = require("../models/StudentAcademicProfile");
const { ROLES } = require("../constants/roles");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

const COMMON_PASSWORD = "Test@123";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 12);

    // 1. Create College
    let college = await College.findOne({ name: "Test College" });
    if (!college) {
      college = await College.create({
        name: "Test College",
        departmentLimit: 10,
        isActive: true,
      });
      console.log("Created Test College");
    } else {
      console.log("Test College already exists");
    }

    // 2. Create Department
    let department = await Department.findOne({
      collegeId: college._id,
      name: "CSE",
    });
    if (!department) {
      department = await Department.create({
        collegeId: college._id,
        name: "CSE",
        hodName: "Test HOD",
      });
      console.log("Created CSE Department");
    } else {
      console.log("CSE Department already exists");
    }

    // 3. Create Principal
    const principalEmail = "principal@test.com";
    let principal = await User.findOne({ email: principalEmail });
    if (!principal) {
      principal = await User.create({
        name: "Test Principal",
        email: principalEmail,
        password_hash: passwordHash,
        role: ROLES.PRINCIPAL,
        collegeId: college._id,
        collegeName: college.name,
        isEmailVerified: true,
      });
      console.log(`Created Principal: ${principalEmail}`);
    } else {
        principal.password_hash = passwordHash;
        principal.collegeId = college._id;
        await principal.save();
        console.log(`Principal exists: ${principalEmail} (password updated)`);
    }

    // 4. Create HOD
    const hodEmail = "hod@test.com";
    let hod = await User.findOne({ email: hodEmail });
    if (!hod) {
      hod = await User.create({
        name: "Test HOD",
        email: hodEmail,
        password_hash: passwordHash,
        role: ROLES.HOD,
        collegeId: college._id,
        collegeName: college.name,
        departmentId: department._id,
        department: department.name,
        isEmailVerified: true,
      });
      console.log(`Created HOD: ${hodEmail}`);
    } else {
        hod.password_hash = passwordHash;
        hod.collegeId = college._id;
        hod.departmentId = department._id;
        await hod.save();
        console.log(`HOD exists: ${hodEmail} (password updated)`);
    }

    // 5. Create Student
    const studentEmail = "student@test.com";
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        name: "Test Student",
        email: studentEmail,
        password_hash: passwordHash,
        role: ROLES.STUDENT,
        collegeId: college._id,
        collegeName: college.name,
        departmentId: department._id,
        department: department.name,
        year: 4,
        batch: "2024",
        isEmailVerified: true,
      });
      console.log(`Created Student: ${studentEmail}`);
    } else {
        student.password_hash = passwordHash;
        student.collegeId = college._id;
        student.departmentId = department._id;
        await student.save();
        console.log(`Student exists: ${studentEmail} (password updated)`);
    }
    
    // Ensure Student Academic Profile exists
    let profile = await StudentAcademicProfile.findOne({ userId: student._id });
    if (!profile) {
        await StudentAcademicProfile.create({
            userId: student._id,
            collegeId: college._id,
            departmentId: department._id,
            year: 4,
            batch: "2024",
            cgpa: 8.5,
            attendancePercent: 90
        });
        console.log("Created Student Academic Profile");
    }

    console.log("\n--- Credentials ---");
    console.log(`Common Password: ${COMMON_PASSWORD}`);
    console.log(`Principal: ${principalEmail}`);
    console.log(`HOD: ${hodEmail}`);
    console.log(`Student: ${studentEmail}`);
    console.log(`Platform Admin: (Use existing credentials or run set-platform-admin.js)`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();