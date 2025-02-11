import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  check: { type: Boolean, default: false },
  alarm: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
});

const Task = mongoose.model('Task', taskSchema);
export default Task;