const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);
module.exports = SupportRequest;
