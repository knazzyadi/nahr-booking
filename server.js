const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// استيراد النماذج
const User = require('./models/User');
const Booking = require('./models/Booking');
const Availability = require('./models/Availability');

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'))
  .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

// إعداد الجلسات
app.use(session({
  secret: 'سر_تشفير_الجلسة_غير_هذه_القيمة',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// استخدام JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد Multer لتخزين الملفات
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// خدمة الملفات الثابتة
app.use('/uploads', express.static('uploads'));

// استيراد المسارات
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const serviceRoutes = require('./routes/services');
app.use('/services', serviceRoutes);

const availabilityRoutes = require('./routes/availability');
app.use('/availability', availabilityRoutes);

const bookingRoutes = require('./routes/bookings');
app.use('/bookings', bookingRoutes);

const settingsRoutes = require('./routes/settings');
app.use('/settings', settingsRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', notificationRoutes);

const publicRoutes = require('./routes/public');
app.use('/', publicRoutes);

// مسار مؤقت لإنشاء مستخدم أدمن
app.get('/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const User = require('./models/User');
    
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      return res.send('الأدمن موجود بالفعل');
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      autoConfirm: false
    });
    
    await admin.save();
    res.send('تم إنشاء مستخدم الأدمن بنجاح. البريد: admin@example.com, كلمة المرور: admin123');
  } catch (error) {
    res.send('حدث خطأ: ' + error.message);
  }
});

// Middleware للتحقق من تسجيل الدخول
function requireLogin(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

// صفحة لوحة التحكم الرئيسية للمهني
app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/auth/login');

    const pendingCount = await Booking.countDocuments({ professionalId: user._id, status: 'pending' });
    const confirmedCount = await Booking.countDocuments({ professionalId: user._id, status: 'confirmed' });
    const cancelledCount = await Booking.countDocuments({ professionalId: user._id, status: 'cancelled' });
    const availabilityCount = await Availability.countDocuments({ professionalId: user._id });
    const Notification = require('./models/Notification');
    const unreadCount = await Notification.countDocuments({ recipientId: user._id, isRead: false });

    let adminLink = '';
    if (user.role === 'admin') {
      adminLink = '<a href="/admin" class="sidebar-item"><i class="fas fa-crown"></i> لوحة تحكم المالك</a>';
    }

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الرئيسية - ${user.name}</title>
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
        /* القائمة الجانبية للشاشات الكبيرة */
        .sidebar {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 260px;
            height: calc(100vh - 40px);
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 25px 15px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            z-index: 100;
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .sidebar-header h4 {
            color: white;
            font-size: 1.3rem;
            margin-bottom: 5px;
        }
        .sidebar-header p {
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
        }
        .sidebar-menu {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .sidebar-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            border-radius: 40px;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
        }
        .sidebar-item i {
            width: 24px;
            font-size: 1.2rem;
            color: #FFD700;
        }
        .sidebar-item:hover {
            background: rgba(255,255,255,0.3);
            transform: translateX(-5px);
        }
        .sidebar-item.active {
            background: rgba(255,255,255,0.2);
            font-weight: 600;
        }
        .badge-sidebar {
            position: absolute;
            left: 15px;
            background: #FF7675;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        /* المحتوى الرئيسي */
        .main-content {
            margin-right: 280px;
            padding: 0 20px;
        }
        /* الشريط العلوي */
        .top-bar {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 15px 30px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .top-bar-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            gap: 15px;
            flex-wrap: nowrap;
        }
        .logo {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            font-size: 1.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex-shrink: 1;
        }
        .logo i {
            margin-left: 10px;
            color: #FFD700;
        }
        .user-name {
            color: white;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex-shrink: 1;
        }
        .user-name i {
            margin-left: 5px;
            color: #FFD700;
        }
        /* بطاقة الملف الشخصي */
        .profile-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 40px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        .cover-container {
            width: 100%;
            height: 200px;
            background-image: url('${user.coverImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}');
            background-size: cover;
            background-position: center;
            border-radius: 30px;
            margin-bottom: -50px;
            position: relative;
        }
        .avatar-container {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 20px;
            z-index: 2;
        }
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            background: white;
        }
        .edit-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            cursor: pointer;
            color: white;
            font-size: 1.5rem;
        }
        .cover-container .edit-overlay {
            border-radius: 30px;
        }
        .avatar-container:hover .edit-overlay {
            opacity: 1;
        }
        .profile-info {
            text-align: center;
            color: white;
            margin-top: 10px;
        }
        .profile-info h3 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            font-size: 2rem;
            margin-bottom: 5px;
        }
        .profile-info p {
            color: rgba(255,255,255,0.9);
            margin-bottom: 10px;
        }
        .profile-bio {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(5px);
            border-radius: 20px;
            padding: 20px;
            max-width: 600px;
            margin: 20px auto 0;
            color: white;
            line-height: 1.8;
            position: relative;
        }
        .bio-edit {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .profile-bio:hover .bio-edit {
            opacity: 1;
        }
        .share-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 25px;
            border-radius: 40px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        .share-btn:hover {
            background: rgba(255,255,255,0.4);
            transform: translateY(-3px);
        }
        /* شبكة الإحصائيات */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 25px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.18);
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-icon {
            font-size: 2.5rem;
            color: #FFD700;
            margin-bottom: 15px;
        }
        .stat-number {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            font-size: 2rem;
            color: white;
            margin-bottom: 5px;
        }
        .stat-label {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        /* القائمة الجانبية للجوال */
        .mobile-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            justify-content: space-around;
            z-index: 100;
        }
        .mobile-nav a {
            color: #2D3436;
            text-align: center;
            text-decoration: none;
            font-size: 0.8rem;
            position: relative;
        }
        .mobile-nav a i {
            display: block;
            font-size: 1.5rem;
            margin-bottom: 5px;
            color: #6C5CE7;
        }
        .mobile-nav a.active {
            color: #6C5CE7;
            font-weight: 600;
        }
        .nav-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #FF7675;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        /* Bottom Sheets */
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
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .form-control {
            width: 100%;
            padding: 15px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 30px;
            font-size: 1rem;
            transition: all 0.3s ease;
            margin-bottom: 15px;
        }
        .form-control:focus {
            outline: none;
            border-color: #6C5CE7;
            box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.1);
        }
        .progress {
            height: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            background: rgba(0,0,0,0.1);
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border-radius: 5px;
            transition: width 0.3s ease;
        }
        @media (max-width: 1024px) {
            .sidebar {
                width: 220px;
            }
            .main-content {
                margin-right: 240px;
            }
        }
        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }
            .main-content {
                margin-right: 0;
                padding-bottom: 70px;
            }
            .mobile-nav {
                display: flex;
            }
        }
        @media (max-width: 480px) {
            .logo { font-size: 1.2rem; }
            .user-name { font-size: 0.9rem; }
            .profile-card { padding: 20px; }
            .cover-container { height: 150px; }
            .avatar-container { width: 80px; height: 80px; }
            .avatar { width: 80px; height: 80px; }
            .profile-info h3 { font-size: 1.5rem; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
        }
    </style>
</head>
<body>
    <!-- القائمة الجانبية للكمبيوتر -->
    <div class="sidebar">
        <div class="sidebar-header">
            <h4>مرحباً ${user.name}</h4>
            <p>${user.role === 'admin' ? 'مدير' : user.profession || 'مهني'}</p>
        </div>
        <div class="sidebar-menu">
            <a href="/services" class="sidebar-item">
                <i class="fas fa-cogs"></i>
                <span>إدارة الخدمات</span>
            </a>
            <a href="/availability" class="sidebar-item">
                <i class="fas fa-clock"></i>
                <span>إدارة المواعيد</span>
            </a>
            <a href="/bookings" class="sidebar-item">
                <i class="fas fa-calendar-alt"></i>
                <span>عرض الحجوزات</span>
            </a>
            <a href="/notifications" class="sidebar-item">
                <i class="fas fa-bell"></i>
                <span>الإشعارات</span>
                ${unreadCount > 0 ? `<span class="badge-sidebar">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
            </a>
            <a href="/settings" class="sidebar-item">
                <i class="fas fa-cog"></i>
                <span>الإعدادات</span>
            </a>
            ${adminLink}
        </div>
    </div>

    <!-- المحتوى الرئيسي -->
    <div class="main-content">
        <!-- الشريط العلوي -->
        <div class="top-bar">
            <div class="top-bar-content">
                <div class="logo">
                    <i class="fas fa-calendar-check"></i> منصة الحجوزات
                </div>
                <span class="user-name"><i class="fas fa-user"></i> ${user.name}</span>
            </div>
        </div>

        <!-- بطاقة الملف الشخصي -->
        <div class="profile-card">
            <div class="cover-container" style="position: relative;">
                <div class="edit-overlay" onclick="openEditSheet('cover')">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
            <div class="avatar-container">
                <img src="${user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'}" class="avatar">
                <div class="edit-overlay" onclick="openEditSheet('avatar')">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
            <div class="profile-info">
                <h3>${user.name}</h3>
                <p>${user.profession || 'مهني'}</p>
                <div class="share-btn" onclick="openShareSheet()">
                    <i class="fas fa-share-alt"></i> مشاركة الرابط
                </div>
                <div class="profile-bio">
                    ${user.bio || '✨ شارك العالم شيئاً عنك... أضف نبذة تعريفية!'}
                    <div class="bio-edit" onclick="openEditSheet('bio')">
                        <i class="fas fa-pencil-alt"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- شبكة الإحصائيات -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-number">${availabilityCount}</div>
                <div class="stat-label">مواعيد متاحة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-hourglass-half"></i></div>
                <div class="stat-number">${pendingCount}</div>
                <div class="stat-label">معلقة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-number">${confirmedCount}</div>
                <div class="stat-label">مؤكدة</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                <div class="stat-number">${cancelledCount}</div>
                <div class="stat-label">ملغاة</div>
            </div>
        </div>
    </div>

    <!-- القائمة الجانبية للجوال -->
    <div class="mobile-nav">
        <a href="/services">
            <i class="fas fa-cogs"></i>
            <span>الخدمات</span>
        </a>
        <a href="/availability">
            <i class="fas fa-clock"></i>
            <span>المواعيد</span>
        </a>
        <a href="/bookings">
            <i class="fas fa-calendar-alt"></i>
            <span>الحجوزات</span>
        </a>
        <a href="/notifications" style="position: relative;">
            <i class="fas fa-bell"></i>
            <span>الإشعارات</span>
            ${unreadCount > 0 ? `<span class="nav-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
        </a>
        <a href="/settings">
            <i class="fas fa-cog"></i>
            <span>الإعدادات</span>
        </a>
    </div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeAllSheets()"></div>

    <!-- Bottom Sheet لتعديل الغلاف -->
    <div class="bottom-sheet" id="editCoverSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-image"></i> تعديل صورة الغلاف</h5>
            <button class="sheet-close" onclick="closeSheet('editCoverSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:15px;">اختر صورة جديدة للغلاف:</p>
            <input type="file" class="form-control" id="coverFile" accept="image/*">
            <div class="progress" id="coverProgress" style="display: none;">
                <div class="progress-bar" style="width: 0%;">0%</div>
            </div>
            <button class="btn-primary-custom" onclick="uploadCover()">رفع الصورة</button>
        </div>
    </div>

    <!-- Bottom Sheet لتعديل الصورة الشخصية -->
    <div class="bottom-sheet" id="editAvatarSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-user-circle"></i> تعديل الصورة الشخصية</h5>
            <button class="sheet-close" onclick="closeSheet('editAvatarSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:15px;">اختر صورة شخصية جديدة:</p>
            <input type="file" class="form-control" id="avatarFile" accept="image/*">
            <div class="progress" id="avatarProgress" style="display: none;">
                <div class="progress-bar" style="width: 0%;">0%</div>
            </div>
            <button class="btn-primary-custom" onclick="uploadAvatar()">رفع الصورة</button>
        </div>
    </div>

    <!-- Bottom Sheet لتعديل النبذة -->
    <div class="bottom-sheet" id="editBioSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-edit"></i> تعديل النبذة</h5>
            <button class="sheet-close" onclick="closeSheet('editBioSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:15px;">أدخل النبذة الجديدة:</p>
            <textarea class="form-control" id="newBio" rows="4">${user.bio || ''}</textarea>
            <button class="btn-primary-custom" onclick="saveBio()">حفظ</button>
        </div>
    </div>

    <!-- Bottom Sheet للمشاركة -->
    <div class="bottom-sheet" id="shareSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-share-alt"></i> مشاركة صفحتك</h5>
            <button class="sheet-close" onclick="closeSheet('shareSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body text-center">
            <p style="color:#2D3436; margin-bottom:15px;">رابط صفحتك العامة:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" class="form-control" id="profileLink" value="http://localhost:3000/p/${user._id}" readonly>
                <button class="btn-primary-custom" style="width: auto; padding: 10px 25px;" onclick="copyLink()"><i class="fas fa-copy"></i></button>
            </div>
            <div id="qrcode" style="display: flex; justify-content: center;"></div>
            <p class="text-muted" style="margin-top:15px; color:#636E72;">امسح الباركود لمشاركة الرابط</p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <script>
        // تمييز الرابط النشط في القائمة الجانبية للجوال والكمبيوتر
        const currentPath = window.location.pathname;
        document.querySelectorAll('.sidebar-item, .mobile-nav a').forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            }
        });

        // دوال فتح Sheets التحرير
        function openEditSheet(type) {
            closeAllSheets();
            document.getElementById('edit' + type.charAt(0).toUpperCase() + type.slice(1) + 'Sheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        // رفع الغلاف
        function uploadCover() {
            const fileInput = document.getElementById('coverFile');
            const file = fileInput.files[0];
            if (!file) return alert('الرجاء اختيار صورة');

            const formData = new FormData();
            formData.append('coverImage', file);

            const progressDiv = document.getElementById('coverProgress');
            const progressBar = progressDiv.querySelector('.progress-bar');
            progressDiv.style.display = 'block';
            progressBar.style.width = '0%';

            fetch('/settings/upload-cover', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.cover-container').style.backgroundImage = 'url(' + data.imagePath + ')';
                    closeSheet('editCoverSheet');
                    fileInput.value = '';
                } else {
                    alert('حدث خطأ: ' + data.error);
                }
                progressDiv.style.display = 'none';
            })
            .catch(err => {
                alert('حدث خطأ في الاتصال');
                progressDiv.style.display = 'none';
            });
        }

        // رفع الصورة الشخصية
        function uploadAvatar() {
            const fileInput = document.getElementById('avatarFile');
            const file = fileInput.files[0];
            if (!file) return alert('الرجاء اختيار صورة');

            const formData = new FormData();
            formData.append('profileImage', file);

            const progressDiv = document.getElementById('avatarProgress');
            const progressBar = progressDiv.querySelector('.progress-bar');
            progressDiv.style.display = 'block';
            progressBar.style.width = '0%';

            fetch('/settings/upload-avatar', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.avatar').src = data.imagePath;
                    closeSheet('editAvatarSheet');
                    fileInput.value = '';
                } else {
                    alert('حدث خطأ: ' + data.error);
                }
                progressDiv.style.display = 'none';
            })
            .catch(err => {
                alert('حدث خطأ في الاتصال');
                progressDiv.style.display = 'none';
            });
        }

        // حفظ النبذة
        function saveBio() {
            const newBio = document.getElementById('newBio').value;
            fetch('/settings/update-bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: newBio })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.profile-bio').innerHTML = newBio || '✨ شارك العالم شيئاً عنك... أضف نبذة تعريفية!';
                    closeSheet('editBioSheet');
                } else {
                    alert('حدث خطأ: ' + data.error);
                }
            });
        }

        // دوال المشاركة
        function openShareSheet() {
            document.getElementById('shareSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
            if (!document.getElementById('qrcode').innerHTML) {
                new QRCode(document.getElementById('qrcode'), {
                    text: 'http://localhost:3000/p/${user._id}',
                    width: 200,
                    height: 200,
                    colorDark: '#6C5CE7',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }

        function copyLink() {
            const linkInput = document.getElementById('profileLink');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            alert('تم نسخ الرابط!');
        }

        function closeSheet(sheetId) {
            document.getElementById(sheetId).classList.remove('show');
            if (!document.querySelector('.bottom-sheet.show')) {
                document.getElementById('overlay').classList.remove('show');
            }
        }

        function closeAllSheets() {
            document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('show'));
            document.getElementById('overlay').classList.remove('show');
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('حدث خطأ في تحميل الصفحة: ' + error.message);
  }
});

// تسجيل الخروج
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.send('حدث خطأ أثناء تسجيل الخروج');
    res.redirect('/auth/login');
  });
});

app.get('/', (req, res) => {
  res.send('الخادم يعمل وقاعدة البيانات متصلة!');
});

app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});