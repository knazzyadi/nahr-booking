const mongoose = require('mongoose');

// Schema for a single day's settings
const daySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  startHour: { type: String, default: '09' },
  startMin: { type: String, default: '00' },
  endHour: { type: String, default: '17' },
  endMin: { type: String, default: '00' }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  duration: {
    type: Number,
    default: 30
  },
  recurrence: {
    type: String,
    enum: ['weekly', 'none'],
    default: 'weekly'
  },
  // Use a Map to store settings for each day (key: day number 0-6)
  days: {
    type: Map,
    of: daySchema,
    default: {
      1: { enabled: true, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      2: { enabled: true, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      3: { enabled: true, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      4: { enabled: true, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      5: { enabled: false, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      6: { enabled: false, startHour: '09', startMin: '00', endHour: '17', endMin: '00' },
      0: { enabled: false, startHour: '09', startMin: '00', endHour: '17', endMin: '00' }
    }
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);