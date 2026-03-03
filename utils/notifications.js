const Notification = require('../models/Notification');
const User = require('../models/User');

async function createNotification(recipientId, type, title, message, data = {}) {
  try {
    // التحقق من أن المستخدم يرغب في استلام هذا النوع من الإشعارات
    const user = await User.findById(recipientId).select('notificationSettings');
    if (!user) return null;

    // تعيين المفتاح المناسب في الإعدادات حسب نوع الإشعار
    let settingKey = '';
    if (type.includes('booking_created')) settingKey = 'bookingCreated';
    else if (type.includes('booking_confirmed')) settingKey = 'bookingConfirmed';
    else if (type.includes('booking_cancelled')) settingKey = 'bookingCancelled';
    else if (type === 'admin_message') settingKey = 'adminMessages';
    else settingKey = 'push'; // افتراضي

    // إذا كان المستخدم عطّل هذا النوع، لا نرسل الإشعار
    if (user.notificationSettings && user.notificationSettings[settingKey] === false) {
      return null;
    }

    const notification = new Notification({ recipientId, type, title, message, data });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
}

module.exports = { createNotification };