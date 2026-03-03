const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Middleware للتحقق من تسجيل الدخول
function requireLogin(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

// عرض جميع إشعارات المستخدم
router.get('/', requireLogin, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.session.userId })
      .sort({ createdAt: -1 });

    // عدد الإشعارات غير المقروءة
    const unreadCount = await Notification.countDocuments({ 
      recipientId: req.session.userId, 
      isRead: false 
    });

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الإشعارات</title>
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
        /* بطاقة الإشعار */
        .notification-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 20px 25px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .notification-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.35);
        }
        .notification-card.unread {
            border-right: 8px solid #6C5CE7;
            background: rgba(108, 92, 231, 0.15);
        }
        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .type-badge {
            padding: 4px 12px;
            border-radius: 40px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-block;
        }
        .type-booking {
            background: #00b894;
            color: white;
        }
        .type-admin {
            background: #6C5CE7;
            color: white;
        }
        .type-system {
            background: #636e72;
            color: white;
        }
        .notification-time {
            color: rgba(255,255,255,0.7);
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .notification-time i {
            color: #FFD700;
            font-size: 0.9rem;
        }
        .notification-title {
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .notification-message {
            color: rgba(255,255,255,0.9);
            font-size: 0.95rem;
            line-height: 1.6;
        }
        .no-notifications {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 30px;
            color: white;
        }
        .no-notifications i {
            font-size: 4rem;
            color: #FFD700;
            margin-bottom: 20px;
            opacity: 0.8;
        }
        .no-notifications p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        /* زر تحديد الكل كمقروء (اختياري) */
        .mark-all-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 40px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
            display: inline-block;
        }
        .mark-all-btn:hover {
            background: rgba(255,255,255,0.4);
            transform: translateY(-2px);
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
    <div class="navbar">
        <span class="navbar-brand"><i class="fas fa-bell"></i> الإشعارات</span>
        <a href="/dashboard" class="btn-back"><i class="fas fa-arrow-right"></i> عودة</a>
    </div>

    ${unreadCount > 0 ? `
    <div style="text-align: left; margin-bottom: 15px;">
        <a href="/notifications/mark-all-read" class="mark-all-btn"><i class="fas fa-check-double"></i> تحديد الكل كمقروء</a>
    </div>
    ` : ''}

    <div class="notifications-container">
        ${notifications.length === 0 ? `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد إشعارات</p>
            </div>
        ` : notifications.map(n => {
            const time = new Date(n.createdAt).toLocaleString('ar-EG');
            let typeClass = '';
            if (n.type.includes('booking')) typeClass = 'type-booking';
            else if (n.type === 'admin_message') typeClass = 'type-admin';
            else typeClass = 'type-system';
            
            let typeText = '';
            if (n.type === 'booking_created') typeText = 'حجز جديد';
            else if (n.type === 'booking_confirmed') typeText = 'تأكيد حجز';
            else if (n.type === 'booking_cancelled') typeText = 'إلغاء حجز';
            else if (n.type === 'admin_message') typeText = 'رسالة إدارة';
            else typeText = 'نظام';

            return `
            <div class="notification-card ${!n.isRead ? 'unread' : ''}" onclick="markAsRead('${n._id}')">
                <div class="notification-header">
                    <span class="type-badge ${typeClass}">${typeText}</span>
                    <span class="notification-time"><i class="fas fa-clock"></i> ${time}</span>
                </div>
                <div class="notification-title">${n.title}</div>
                <div class="notification-message">${n.message}</div>
            </div>
            `;
        }).join('')}
    </div>

    <script>
        function markAsRead(notificationId) {
            fetch('/notifications/mark-read/' + notificationId, { method: 'POST' })
                .then(() => {
                    location.reload();
                });
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('خطأ في تحميل الإشعارات: ' + error.message);
  }
});

// تعليم إشعار كمقروء
router.post('/mark-read/:id', requireLogin, async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, recipientId: req.session.userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تعليم جميع الإشعارات كمقروءة
router.post('/mark-all-read', requireLogin, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.session.userId, isRead: false },
      { isRead: true }
    );
    res.redirect('/notifications');
  } catch (error) {
    res.status(500).send('خطأ: ' + error.message);
  }
});

// الحصول على عدد الإشعارات غير المقروءة
router.get('/unread-count', requireLogin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipientId: req.session.userId, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;