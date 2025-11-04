

const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  name: String,
  description: {type: String, default: ""},
  deadline: Date,
  completed: { type: Boolean },
  assignedUser: { type: String, default: "" },
  assignedUserName: { type: String, default: "unassigned" },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", TaskSchema);