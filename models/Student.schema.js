const mongoose = require("mongoose");

const studentSchema = mongoose.Schema({
  FullName: {
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
  PhoneNumber: {
    type: String,
    default: "", // Default value for PhoneNumber
  },
  DateofBirth: {
    type: Date,
    default: null, // Default value for DateofBirth (null if not provided)
  },
  Address: {
    type: String,
    default: "", 
  },
  Country: {
    type: String,
    default: "", 
  },
}, { timestamps: true });

const model = mongoose.model("Student", studentSchema);
module.exports = model;
