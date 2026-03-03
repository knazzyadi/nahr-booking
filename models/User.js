const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: function() { return this.role === 'professional'; }
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'professional'],
    default: 'professional'
  },
  profession: {
    type: String,
    enum: ['محامي', 'طبيب', 'حلاق', 'سباك', 'أخرى'],
    required: function() { return this.role === 'professional'; }
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150?text=صورة'
  },
  coverImage: {
    type: String,
    default: 'https://via.placeholder.com/800x200?text=غلاف'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  autoConfirm: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    bookingCreated: { type: Boolean, default: true },
    bookingConfirmed: { type: Boolean, default: true },
    bookingCancelled: { type: Boolean, default: true },
    adminMessages: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);