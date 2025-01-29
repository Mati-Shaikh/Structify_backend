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
  learningPath: {
    topics: [{
      topic: {
        type: String,
        required: true
      },
      subtopics: [{
        subtopic: {
          type: String,
          required: true
        },
        levels: [{
          id: {
            type: Number,
            required: true
          },
          name: {
            type: String,
            required: true
          },
          isLocked: {
            type: Boolean,
            default: true
          },
          isCompleted: {
            type: Boolean,
            default: false
          },
          danger: {
            type: Boolean,
            default: false
          }
        }],
        assessment: {
          id: {
            type: Number
          },
          name: {
            type: String
          },
          duration: {
            type: String
          },
          isLocked: {
            type: Boolean,
            default: true
          },
          isCompleted: {
            type: Boolean,
            default: false
          },
          danger: {
            type: Boolean,
            default: false
          }
        }
      }]
    }]
  },
  currentStatus: {
    topic: {
      type: String,
      default: "Linked List"
    },
    subtopic: {
      type: String,
      default: "Insertion"
    },
    level: {
      id: {
        type: Number,
        default: 1
      },
      name: {
        type: String,
        default: "Insertion At Front"
      }
    },
    
  },
  streak: {
    currentStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    loginDates: [{ type: Date }] // Store all login dates
  },  
  assessments: [{
    id: {
      type: Number,
    },
    name: {
        type: String,
      },
    date: {
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
    dangerLevels: [{
      id: Number,
      name: String
    }]
  }],
  
}, { timestamps: true });

const UserProgress = mongoose.model("UserProgress", userProgressSchema);
module.exports = UserProgress;