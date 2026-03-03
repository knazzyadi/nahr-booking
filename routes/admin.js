const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const bcrypt = require('bcrypt');
const { createNotification } = require('../utils/notifications');

function requireAdmin(req, res, next) {
  if (req.session.userRole === 'admin') {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// صفحة دخول الأدمن (GET) - بتصميم جديد
router.get('/login', (req, res) => {
  if (req.session.userId && req.session.userRole === 'admin') {
    return res.redirect('/admin');
  }
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دخول المالك</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h2 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2rem;
        }
        .input-group {
            margin-bottom: 20px;
        }
        .input-group label {
            display: block;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .input-group input {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid transparent;
            border-radius: 40px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .input-group input:focus {
            outline: none;
            border-color: #FFD700;
            background: white;
        }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: none;
            border-radius: 40px;
            color: #333;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            margin-top: 10px;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: white;
            text-decoration: none;
            font-size: 0.9rem;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        .back-link a:hover {
            opacity: 1;
            text-decoration: underline;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo i {
            font-size: 4rem;
            color: white;
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 50%;
        }
    </style>
</head>
<body>
    <div class="glass-card">
        <div class="logo">
            <i class="fas fa-crown"></i>
        </div>
        <h2>دخول المالك</h2>
        <form method="POST" action="/admin/login">
            <div class="input-group">
                <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                <input type="email" name="email" required placeholder="admin@example.com">
            </div>
            <div class="input-group">
                <label><i class="fas fa-lock"></i> كلمة المرور</label>
                <input type="password" name="password" required placeholder="********">
            </div>
            <button type="submit">دخول</button>
        </form>
        <div class="back-link">
            <a href="/auth/login"><i class="fas fa-arrow-right"></i> العودة لدخول المهنيين</a>
        </div>
    </div>
</body>
</html>
  `);
});

// معالجة دخول الأدمن (POST) - بدون تغيير
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#dc3545;">خطأ</h3>
          <p>لا يوجد حساب أدمن بهذا البريد</p>
          <a href="/admin/login" class="btn btn-primary">عودة</a>
        </div>
      `);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#dc3545;">خطأ</h3>
          <p>كلمة مرور غير صحيحة</p>
          <a href="/admin/login" class="btn btn-primary">عودة</a>
        </div>
      `);
    }
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    res.redirect('/admin');
  } catch (error) {
    res.send('حدث خطأ: ' + error.message);
  }
});

// الصفحة الرئيسية للأدمن (محمية) - بتصميم جديد
router.get('/', requireAdmin, async (req, res) => {
  try {
    const professionalsCount = await User.countDocuments({ role: 'professional' });
    const activeProfessionalsCount = await User.countDocuments({ role: 'professional', isActive: true });
    const inactiveProfessionalsCount = professionalsCount - activeProfessionalsCount;
    const bookingsCount = await Booking.countDocuments();
    const uniqueClients = await Booking.distinct('clientEmail');
    const clientsCount = uniqueClients.length;

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة تحكم المالك</title>
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
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .navbar-brand {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            font-size: 1.5rem;
        }
        .navbar-brand i {
            margin-left: 10px;
            color: #FFD700;
        }
        .btn-logout {
            background: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 25px;
            border-radius: 40px;
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .btn-logout:hover {
            background: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 25px;
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
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .management-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .card-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        .card-header i {
            font-size: 2rem;
            color: #FFD700;
        }
        .card-header h3 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 600;
            color: white;
            font-size: 1.3rem;
        }
        .card-body {
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            padding: 12px 25px;
            border-radius: 40px;
            color: #333;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="navbar">
        <span class="navbar-brand"><i class="fas fa-crown"></i> لوحة تحكم المالك</span>
        <a href="/admin/logout" class="btn-logout"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-users"></i></div>
            <div class="stat-number">${professionalsCount}</div>
            <div class="stat-label">إجمالي المهنيين</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-number">${activeProfessionalsCount}</div>
            <div class="stat-label">نشط</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-ban"></i></div>
            <div class="stat-number">${inactiveProfessionalsCount}</div>
            <div class="stat-label">موقوف</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-number">${bookingsCount}</div>
            <div class="stat-label">إجمالي الحجوزات</div>
        </div>
    </div>

    <div class="cards-grid">
        <div class="management-card">
            <div class="card-header">
                <i class="fas fa-briefcase"></i>
                <h3>إدارة المهنيين</h3>
            </div>
            <div class="card-body">
                عرض جميع المهنيين، تفعيل أو إيقاف حساباتهم، وإرسال إشعارات فردية أو جماعية.
            </div>
            <a href="/admin/professionals" class="btn-primary"><i class="fas fa-arrow-left"></i> عرض المهنيين</a>
        </div>
        <div class="management-card">
            <div class="card-header">
                <i class="fas fa-user-tie"></i>
                <h3>إدارة العملاء</h3>
            </div>
            <div class="card-body">
                عرض جميع العملاء الذين قاموا بالحجز مع تفاصيل آخر حجز لكل عميل.
            </div>
            <a href="/admin/clients" class="btn-primary"><i class="fas fa-arrow-left"></i> عرض العملاء</a>
        </div>
    </div>
</body>
</html>
    `);
  } catch (error) {
    res.send('حدث خطأ: ' + error.message);
  }
});

// عرض جميع المهنيين (صفحة المهنيين) - بتصميم جديد
router.get('/professionals', requireAdmin, async (req, res) => {
  try {
    const professionals = await User.find({ role: 'professional' }).sort({ createdAt: -1 });
    let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المهنيين</title>
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
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .navbar-brand {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            font-size: 1.5rem;
        }
        .navbar-brand i {
            margin-left: 10px;
            color: #FFD700;
        }
        .navbar-actions {
            display: flex;
            gap: 15px;
        }
        .btn-nav {
            background: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 25px;
            border-radius: 40px;
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .btn-nav:hover {
            background: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        .btn-broadcast {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: none;
            color: #333;
            font-weight: 600;
        }
        .btn-broadcast:hover {
            background: linear-gradient(45deg, #FFA500, #FFD700);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            color: white;
        }
        th {
            text-align: right;
            padding: 15px 10px;
            font-weight: 600;
            color: #FFD700;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        }
        td {
            padding: 15px 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .badge-active {
            background: rgba(0, 255, 0, 0.2);
            color: #00FF00;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .badge-inactive {
            background: rgba(255, 0, 0, 0.2);
            color: #FF4444;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .btn-action {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 15px;
            border-radius: 30px;
            text-decoration: none;
            font-size: 0.9rem;
            margin: 2px;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .btn-action:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: translateY(-2px);
        }
        .btn-info {
            background: rgba(0, 150, 255, 0.3);
        }
        .btn-warning {
            background: rgba(255, 165, 0, 0.3);
        }
        .btn-success {
            background: rgba(0, 200, 0, 0.3);
        }
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal.show {
            display: flex;
        }
        .modal-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 15px;
        }
        .modal-header h3 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #333;
        }
        .close {
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
        }
        .modal-body input,
        .modal-body textarea {
            width: 100%;
            padding: 12px 15px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 30px;
            font-size: 1rem;
        }
        .modal-footer {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .btn-modal {
            padding: 10px 25px;
            border-radius: 30px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .btn-modal.primary {
            background: #6C5CE7;
            color: white;
        }
        .btn-modal.secondary {
            background: #ddd;
        }
        .btn-modal:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="navbar">
        <span class="navbar-brand"><i class="fas fa-users-cog"></i> المهنيين المسجلين</span>
        <div class="navbar-actions">
            <button class="btn-nav btn-broadcast" onclick="openBroadcastModal()">
                <i class="fas fa-bullhorn"></i> إشعار للجميع
            </button>
            <a href="/admin" class="btn-nav"><i class="fas fa-arrow-right"></i> عودة</a>
        </div>
    </div>

    <div class="glass-card">
        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>البريد</th>
                    <th>رقم الهاتف</th>
                    <th>المهنة</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    professionals.forEach(p => {
      const statusBadge = p.isActive !== false ? 
        '<span class="badge-active">نشط</span>' : 
        '<span class="badge-inactive">موقوف</span>';
      const toggleUrl = p.isActive !== false ? 
        `/admin/deactivate/${p._id}` : 
        `/admin/activate/${p._id}`;
      const toggleText = p.isActive !== false ? 'إيقاف' : 'تفعيل';
      const toggleClass = p.isActive !== false ? 'btn-warning' : 'btn-success';
      
      html += `<tr>
        <td>${p.name}</td>
        <td>${p.email}</td>
        <td>${p.phone || 'غير متوفر'}</td>
        <td>${p.profession}</td>
        <td>${statusBadge}</td>
        <td>
          <a href="/admin/send-notification/${p._id}" class="btn-action btn-info"><i class="fas fa-envelope"></i> إشعار</a>
          <a href="${toggleUrl}" class="btn-action ${toggleClass}" onclick="return confirm('هل أنت متأكد؟')">${toggleText}</a>
        </td>
      </tr>`;
    });
    html += `
            </tbody>
        </table>
    </div>

    <!-- Modal إشعار للجميع -->
    <div class="modal" id="broadcastModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-bullhorn"></i> إرسال إشعار للجميع</h3>
                <span class="close" onclick="closeBroadcastModal()">&times;</span>
            </div>
            <div class="modal-body">
                <input type="text" id="broadcastTitle" placeholder="عنوان الإشعار" required>
                <textarea id="broadcastMessage" rows="4" placeholder="نص الإشعار" required></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn-modal secondary" onclick="closeBroadcastModal()">إلغاء</button>
                <button class="btn-modal primary" onclick="sendBroadcast()">إرسال</button>
            </div>
        </div>
    </div>

    <script>
        function openBroadcastModal() {
            document.getElementById('broadcastModal').classList.add('show');
        }
        function closeBroadcastModal() {
            document.getElementById('broadcastModal').classList.remove('show');
        }
        function sendBroadcast() {
            const title = document.getElementById('broadcastTitle').value;
            const message = document.getElementById('broadcastMessage').value;
            if (!title || !message) {
                alert('يرجى ملء جميع الحقول');
                return;
            }
            fetch('/admin/broadcast-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('تم إرسال الإشعارات بنجاح إلى ' + data.count + ' مهني');
                    closeBroadcastModal();
                    document.getElementById('broadcastTitle').value = '';
                    document.getElementById('broadcastMessage').value = '';
                } else {
                    alert('حدث خطأ: ' + data.error);
                }
            });
        }
    </script>
</body>
</html>
    `;
    res.send(html);
  } catch (error) {
    res.send('خطأ في تحميل المهنيين: ' + error.message);
  }
});

// باقي المسارات (broadcast-notification, send-notification, activate, deactivate, clients, logout) تبقى كما هي مع تعديلات طفيفة في التصميم (اختياري)
// ... (سأتركها كما هي للاختصار، لكن يمكن تحسينها بنفس الأسلوب إذا أردت)

module.exports = router;