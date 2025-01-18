import mongoose from 'mongoose';
import {v4 as uuid} from 'uuid'

const taskSchema = mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: uuid
    },

    task: {
        required: true,
        type: String,
    },
    
    check: {
        type: String,
        required: true,
        unique: true
    },

    
}, {timestamps: true})

const tasks = mongoose.model('tasks', taskSchema);
export default tasks