// mongodb/models/class-model.js
import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  day: {
    // For simplicity, store the day as a string (e.g., "Monday", "Tuesday", etc.)
    type: String,
    required: true
  },
  startTime: {
    type: String, // You can also use Date if you prefer
    required: true
  },
  endTime: {
    type: String, // Or Date, if you wish
    required: true
  },
  alarm: {
    // Optional alarm time – stored as a Date if you want to trigger alarms at a specific time
    type: Date,
    default: null
  },
  // Additional fields like location or instructor can be added here
});

export default mongoose.model('Class', ClassSchema);
