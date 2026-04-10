// Task model — belongs to a User via userId reference.
// Status is restricted to three allowed values.

const mongoose = require('mongoose');

const TASK_STATUSES = ['pending', 'completed', 'deleted'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: 'Status must be pending, completed, or deleted',
      },
      default: 'pending',
    },
    // Foreign key linking this task to its owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for fast per-user queries
    },
  },
  { timestamps: true }
);

// Compound index: queries filtered by userId + status are very common
taskSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
