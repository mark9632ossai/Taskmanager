import mongoose from 'mongoose';

const taskSchema = mongoose.Schema({
    task: {
        type: String,
        required: true,
    },
    check: {
        type: Boolean,
        default: false,
    },
    alarm: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;