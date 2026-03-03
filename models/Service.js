const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // المدة بالدقائق
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  notes: {
    type: String, // مثل رابط Zoom أو ملاحظات أخرى
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);