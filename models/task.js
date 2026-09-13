import mongoose from "mongoose";

const revisionSchema = new mongoose.Schema({

  day: {
    type: Number,
    required: true
  },

  date: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["locked", "pending", "completed"],
    default: "locked"
  },

  unlocked: {
    type: Boolean,
    default: false
  },

  emailSent: {
    type: Boolean,
    default: false
  },

  completedAt: {
    type: Date,
    default: null
  }

});


const taskSchema = new mongoose.Schema({

  // 👤 Task belongs to this user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: {
    type: String,
    required: true
  },

  tasks: {
    type: [String],
    required: true
  },

  revisions: {
    type: [revisionSchema],
    required: true
  }

});


const Task = mongoose.model(
  "Task",
  taskSchema
);

export default Task;