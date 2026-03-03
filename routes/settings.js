const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// إعداد multer لهذا المسار
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('الملف غير مدعوم. يرجى رفع صور فقط.'));
    }
  }
});

// صفحة الإعدادات (بتصميم موحد مع باقي الصفحات)
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/auth/login');
    
    // التأكد من وجود كائن الإعدادات
    if (!user.notificationSettings) {
      user.notificationSettings = {
        email: true,
        push: true,
        bookingCreated: true,
        bookingConfirmed: true,
        bookingCancelled: true,
        adminMessages: true
      };
    }

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الإعدادات</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        /* شريط التنقل الموحد */
        .navbar {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 15px 30px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            flex-wrap: nowrap;
        }
        .navbar-brand {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            font-size: 1.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .navbar-brand i {
            margin-left: 10px;
            color: #FFD700;
        }
        .btn-back {
            background: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 20px;
            border-radius: 40px;
            color: white;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        .btn-back:hover {
            background: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        /* البطاقة الزجاجية */
        .glass-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 30px;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h2 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            margin-bottom: 30px;
            text-align: center;
            font-size: 2rem;
        }
        h2 i {
            margin-left: 10px;
            color: #FFD700;
        }
        .setting-item {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            border-radius: 20px;
            padding: 18px 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .setting-label {
            color: white;
            font-weight: 500;
            font-size: 1.1rem;
        }
        .setting-label i {
            margin-left: 10px;
            color: #FFD700;
        }
        /* مفتاح التبديل (switch) */
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255,255,255,0.3);
            transition: .4s;
            border-radius: 34px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
        }
        input:checked + .slider:before {
            transform: translateX(26px);
        }
        .notification-card {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            border-radius: 20px;
            padding: 18px 20px;
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .notification-card:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-3px);
        }
        .notification-info {
            color: white;
        }
        .notification-info h6 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        .notification-info p {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        .chevron-icon {
            color: #FFD700;
            font-size: 1.3rem;
        }
        .btn-primary-custom {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 15px 30px;
            font-weight: 600;
            width: 100%;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .btn-danger-custom {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 40px;
            padding: 15px 30px;
            font-weight: 600;
            width: 100%;
            text-decoration: none;
            display: block;
            text-align: center;
            margin-top: 20px;
            transition: all 0.3s ease;
        }
        .btn-danger-custom:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-3px);
        }
        /* Bottom Sheet */
        .bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top-left-radius: 40px;
            border-top-right-radius: 40px;
            box-shadow: 0 -5px 40px rgba(0,0,0,0.2);
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 1050;
            max-height: 80vh;
            overflow-y: auto;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .bottom-sheet.show {
            transform: translateY(0);
        }
        .sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #6C5CE7;
        }
        .sheet-header h5 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 600;
            color: #2D3436;
            font-size: 1.4rem;
        }
        .sheet-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #6C5CE7;
            transition: transform 0.3s ease;
        }
        .sheet-close:hover {
            transform: scale(1.2);
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
            z-index: 1040;
            display: none;
        }
        .overlay.show {
            display: block;
        }
        .setting-item-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .setting-item-inner:last-child {
            border-bottom: none;
        }
        .setting-item-inner span {
            color: #2D3436;
            font-weight: 500;
        }
        .setting-item-inner span i {
            margin-left: 10px;
            color: #6C5CE7;
        }
        .text-muted {
            color: #636E72 !important;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .navbar {
                padding: 12px 20px;
            }
            .navbar-brand {
                font-size: 1.2rem;
            }
            .btn-back {
                padding: 6px 15px;
                font-size: 0.8rem;
            }
            .glass-card { padding: 20px; }
        }
        @media (max-width: 480px) {
            .navbar-brand {
                font-size: 1rem;
            }
            .btn-back {
                padding: 5px 12px;
                font-size: 0.75rem;
            }
        }
    </style>
</head>
<body>
    <!-- شريط التنقل الموحد -->
    <div class="navbar">
        <span class="navbar-brand"><i class="fas fa-cog"></i> الإعدادات</span>
        <a href="/dashboard" class="btn-back"><i class="fas fa-arrow-right"></i> عودة</a>
    </div>

    <div class="glass-card">
        <h2><i class="fas fa-sliders-h"></i> الإعدادات العامة</h2>
        <form method="POST" action="/settings" id="mainSettingsForm">
            <div class="setting-item">
                <span class="setting-label"><i class="fas fa-check-circle"></i> تأكيد الحجوزات تلقائياً</span>
                <label class="switch">
                    <input type="checkbox" name="autoConfirm" id="autoConfirm" ${user.autoConfirm ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <div class="notification-card" onclick="openNotificationSheet()">
                <div class="notification-info">
                    <h6><i class="fas fa-bell"></i> إعدادات الإشعارات</h6>
                    <p>اختر الإشعارات التي تريد استلامها</p>
                </div>
                <i class="fas fa-chevron-left chevron-icon"></i>
            </div>

            <button type="submit" class="btn-primary-custom"><i class="fas fa-save"></i> حفظ الإعدادات</button>
        </form>

        <a href="/auth/logout" class="btn-danger-custom"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeSheet()"></div>

    <!-- Bottom Sheet لإعدادات الإشعارات -->
    <div class="bottom-sheet" id="notificationSheet">
        <div class="sheet-header">
            <h5>إعدادات الإشعارات</h5>
            <button class="sheet-close" onclick="closeSheet()"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:20px;">حدد أنواع الإشعارات التي ترغب في استلامها:</p>
            <div class="setting-item-inner">
                <span><i class="fas fa-envelope"></i> البريد الإلكتروني</span>
                <label class="switch">
                    <input type="checkbox" id="emailNotify" ${user.notificationSettings.email ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item-inner">
                <span><i class="fas fa-bell"></i> إشعارات داخل التطبيق</span>
                <label class="switch">
                    <input type="checkbox" id="pushNotify" ${user.notificationSettings.push ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <hr style="border-color:rgba(0,0,0,0.1); margin:15px 0;">
            <div class="setting-item-inner">
                <span><i class="fas fa-plus-circle"></i> عند إنشاء حجز جديد</span>
                <label class="switch">
                    <input type="checkbox" id="bookingCreated" ${user.notificationSettings.bookingCreated ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item-inner">
                <span><i class="fas fa-check-circle"></i> عند تأكيد الحجز</span>
                <label class="switch">
                    <input type="checkbox" id="bookingConfirmed" ${user.notificationSettings.bookingConfirmed ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item-inner">
                <span><i class="fas fa-times-circle"></i> عند إلغاء الحجز</span>
                <label class="switch">
                    <input type="checkbox" id="bookingCancelled" ${user.notificationSettings.bookingCancelled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item-inner">
                <span><i class="fas fa-envelope-open-text"></i> رسائل الإدارة</span>
                <label class="switch">
                    <input type="checkbox" id="adminMessages" ${user.notificationSettings.adminMessages ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div style="margin-top:25px;">
                <button class="btn-primary-custom" onclick="saveNotificationSettings()">تأكيد</button>
            </div>
        </div>
    </div>

    <script>
        function openNotificationSheet() {
            document.getElementById('notificationSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        function closeSheet() {
            document.getElementById('notificationSheet').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        }

        function saveNotificationSettings() {
            // إزالة أي حقول سابقة للإشعارات
            document.querySelectorAll('.notify-field').forEach(el => el.remove());
            
            const form = document.getElementById('mainSettingsForm');
            const fields = [
                { id: 'emailNotify', name: 'emailNotify' },
                { id: 'pushNotify', name: 'pushNotify' },
                { id: 'bookingCreated', name: 'bookingCreated' },
                { id: 'bookingConfirmed', name: 'bookingConfirmed' },
                { id: 'bookingCancelled', name: 'bookingCancelled' },
                { id: 'adminMessages', name: 'adminMessages' }
            ];
            
            fields.forEach(field => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = field.name;
                input.value = document.getElementById(field.id).checked ? 'on' : 'off';
                input.classList.add('notify-field');
                form.appendChild(input);
            });

            closeSheet();
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.send('حدث خطأ: ' + error.message);
  }
});

// حفظ الإعدادات (POST)
router.post('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const { autoConfirm, emailNotify, pushNotify, bookingCreated, bookingConfirmed, bookingCancelled, adminMessages } = req.body;
    
    const autoConfirmBool = autoConfirm === 'on';
    
    const notificationSettings = {
      email: emailNotify === 'on',
      push: pushNotify === 'on',
      bookingCreated: bookingCreated === 'on',
      bookingConfirmed: bookingConfirmed === 'on',
      bookingCancelled: bookingCancelled === 'on',
      adminMessages: adminMessages === 'on'
    };

    await User.updateOne(
      { _id: req.session.userId },
      { 
        autoConfirm: autoConfirmBool,
        notificationSettings
      }
    );
    
    res.redirect('/dashboard');
  } catch (error) {
    res.send('حدث خطأ في الحفظ: ' + error.message);
  }
});

// ==================== مسارات API لرفع الصور ====================
router.post('/upload-cover', upload.single('coverImage'), async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'غير مصرح' });
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم رفع أي ملف' });
    }
    const imagePath = '/uploads/' + req.file.filename;
    await User.updateOne({ _id: req.session.userId }, { coverImage: imagePath });
    res.json({ success: true, imagePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/upload-avatar', upload.single('profileImage'), async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'غير مصرح' });
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم رفع أي ملف' });
    }
    const imagePath = '/uploads/' + req.file.filename;
    await User.updateOne({ _id: req.session.userId }, { profileImage: imagePath });
    res.json({ success: true, imagePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تحديث النبذة
router.post('/update-bio', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'غير مصرح' });
  try {
    const { bio } = req.body;
    await User.updateOne({ _id: req.session.userId }, { bio });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;