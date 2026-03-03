const nodemailer = require('nodemailer');

// إعداد الناقل باستخدام بيانات Ethereal من ملف .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// دالة إرسال إيميل
async function sendEmail({ to, subject, html }) {
  try {
    // إرسال البريد
    const info = await transporter.sendMail({
      from: '"نظام الحجوزات" <noreply@booking-system.com>',
      to,
      subject,
      html,
    });

    console.log(`✅ تم إرسال البريد إلى ${to}`);
    console.log(`🔗 معاينة الرابط: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error('❌ فشل إرسال البريد:', error);
  }
}

module.exports = sendEmail;