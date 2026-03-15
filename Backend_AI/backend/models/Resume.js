const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
   
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      address: String,
      linkedin: String,
      github: String,
      portfolio: String
    },

    education: [
      {
        degree: String,
        institution: String,
        year: String,
        score: String
      }
    ],

    
    skills: {
      type: [String],
      default: []
    },

   
    projects: [
      {
        title: String,
        description: String,
        technologies: String,
        // AI Evaluation fields
        qualityScore: { type: Number, default: 0 },
        relevance: { type: String, default: "" },
        level: { type: String, enum: ["Industrial", "Academic", ""], default: "" },
        suggestions: { type: [String], default: [] }
      }
    ],

  
    certifications: [
      {
        name: String,
        issuedBy: String,
        year: String
      }
    ],

    
    selectedTemplate: {
      type: String,
      default: ""
    },

    
    resumeCompletion: {
      type: Number,
      default: 0   // 0–100
    },

   
    atsScore: {
      type: Number,
      default: 0
    },

    extractedSkills: {
      type: [String],
      default: []
    },

    missingSkills: {
      type: [String],
      default: []
    },

    experienceLevel: {
      type: String,
      default: ""
    },

    profileSummary: {
      type: String,
      default: ""
    },

    jobMatchScore: {
      type: Number,
      default: 0
    },

    calibrationReasons: {
      atsScoreReason: { type: String, default: "" },
      jobMatchReason: { type: String, default: "" },
      topStrengths: { type: [String], default: [] },
      improvementAreas: { type: [String], default: [] },
      suggestedSkills: { type: [String], default: [] }
    },

    lastAIScoredAt: {
      type: Date
    },

    pdfUrl: {
      type: String,
      default: ""
    },

    pdfGeneratedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

ResumeSchema.index({ atsScore: -1 });
ResumeSchema.index({ jobMatchScore: -1 });

module.exports = mongoose.model("Resume", ResumeSchema);
