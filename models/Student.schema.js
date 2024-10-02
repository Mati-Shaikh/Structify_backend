const mongoose = require("mongoose");

const studentSchema = mongoose.Schema({
  FirstName: {
    type: String,
    default: "", // Default value for FullName
  },
  LastName: {
    type: String,
    default: "", // Default value for FullName
  },
  Email: {
    type: String,
    default: "", // Default value for Email
  },
  Password: {
    type: String,
    default: "", // Default value for Password
  },
  Age: {
    type: Number,
    default: 1, 
  },
  resetPin: { type: String },  // Store the reset PIN
  pinExpires: { type: Date },  // Expiry time for the PIN
}, { timestamps: true });

const model = mongoose.model("Student", studentSchema);
module.exports = model;
