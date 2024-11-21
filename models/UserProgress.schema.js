const mongoose = require("mongoose");

// New schema to track user's level progress and assessment performance
const userProgressSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  showWelcome: {
    type: Boolean,
    default: true  
  },
  showInitialQuestions: {
    type: Boolean,
    default: true  
  },
  levelsCompleted: [{
    levelNumber: {
      type: Number,
      required: true
    },
    levelName: {
      type: String,
      required: true
    },
  }],
  levelsUnlocked: [{
    levelNumber: {
      type: Number,
      required: true
    },
    levelName: {
      type: String,
      required: true
    },
  }],
  assessments: [{
    assessmentName: {
        type: String,
      },
    assessmentDate: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    },
    difficultAreas: [{
      levelNumber: Number,
      levelName: String
    }]
  }],
  
}, { timestamps: true });

const UserProgress = mongoose.model("UserProgress", userProgressSchema);
module.exports = UserProgress;