const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

const allowedDurations = [15, 30, 45, 60];

// عرض جميع خدمات المهني المسجل
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const services = await Service.find({ professionalId: req.session.userId });
    
    let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الخدمات</title>
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
        .btn-primary-custom {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 12px 30px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
            font-size: 1rem;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .service-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .service-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.35);
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .service-info h5 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 600;
            color: white;
            font-size: 1.3rem;
            margin-bottom: 5px;
        }
        .service-info p {
            color: rgba(255,255,255,0.9);
            font-size: 0.95rem;
        }
        .info-icon {
            width: 45px;
            height: 45px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .info-icon:hover {
            background: rgba(255,255,255,0.4);
            transform: scale(1.1);
        }
        .no-services {
            color: white;
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 30px;
            font-size: 1.1rem;
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
        .detail-item {
            margin-bottom: 20px;
        }
        .detail-label {
            color: #6C5CE7;
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 5px;
            display: block;
        }
        .detail-value {
            color: #2D3436;
            font-size: 1.1rem;
            font-weight: 500;
            background: #f0f0f0;
            padding: 12px 15px;
            border-radius: 15px;
        }
        .sheet-actions {
            display: flex;
            gap: 15px;
            margin-top: 25px;
        }
        .btn-sheet-edit {
            flex: 1;
            background: linear-gradient(135deg, #00CEC9, #00b894);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-sheet-edit:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,206,201,0.4);
        }
        .btn-sheet-delete {
            flex: 1;
            background: linear-gradient(135deg, #FF7675, #d63031);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-sheet-delete:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(255,118,117,0.4);
        }
        /* Toast */
        .toast-container {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1100;
        }
        .toast-custom {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 50px;
            padding: 15px 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            color: #2D3436;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .toast-custom i {
            color: #00CEC9;
            font-size: 1.2rem;
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
            .services-grid {
                grid-template-columns: 1fr;
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
        <span class="navbar-brand"><i class="fas fa-cogs"></i> إدارة الخدمات</span>
        <a href="/dashboard" class="btn-back"><i class="fas fa-arrow-right"></i> عودة</a>
    </div>

    <div style="margin-bottom: 20px; text-align: left;">
        <a href="/services/new" class="btn-primary-custom"><i class="fas fa-plus"></i> إضافة خدمة جديدة</a>
    </div>

    <div class="services-grid">
        ${services.length === 0 
            ? '<div class="no-services">لا توجد خدمات مضافة بعد. أضف خدمتك الأولى!</div>'
            : services.map(s => `
                <div class="service-card" onclick="openSheet('${s._id}')">
                    <div class="service-info">
                        <h5>${s.name}</h5>
                        <p><i class="fas fa-clock" style="margin-left:5px;"></i> ${s.duration} دقيقة</p>
                    </div>
                    <div class="info-icon" onclick="event.stopPropagation(); openSheet('${s._id}')">
                        <i class="fas fa-info"></i>
                    </div>
                </div>
            `).join('')
        }
    </div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeSheet()"></div>

    <!-- Bottom Sheet -->
    <div class="bottom-sheet" id="bottomSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-info-circle" style="margin-left:10px;"></i> تفاصيل الخدمة</h5>
            <button class="sheet-close" onclick="closeSheet()"><i class="fas fa-times"></i></button>
        </div>
        <div id="sheetContent"></div>
    </div>

    <!-- Toast for success message -->
    <div class="toast-container" id="toastContainer" style="display: none;">
        <div class="toast-custom" id="toastMessage">
            <i class="fas fa-check-circle"></i>
            <span id="toastText">تم إضافة الخدمة بنجاح!</span>
        </div>
    </div>

    <script>
        // تمرير بيانات الخدمات إلى JavaScript
        const servicesData = ${JSON.stringify(services.map(s => ({
            _id: s._id.toString(),
            name: s.name,
            duration: s.duration,
            price: s.price,
            notes: s.notes || 'لا توجد ملاحظات'
        })))};

        // عرض toast إذا كان هناك success
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('success')) {
            let message = '';
            switch(urlParams.get('success')) {
                case 'added': message = 'تم إضافة الخدمة بنجاح!'; break;
                case 'updated': message = 'تم تحديث الخدمة بنجاح!'; break;
                case 'deleted': message = 'تم حذف الخدمة بنجاح!'; break;
                default: message = 'تمت العملية بنجاح!';
            }
            const toastContainer = document.getElementById('toastContainer');
            document.getElementById('toastText').innerText = message;
            toastContainer.style.display = 'block';
            setTimeout(() => {
                toastContainer.style.display = 'none';
            }, 3000);
            
            // إزالة المعلمة من الرابط
            const url = new URL(window.location);
            url.searchParams.delete('success');
            window.history.replaceState({}, document.title, url);
        }

        function openSheet(serviceId) {
            const service = servicesData.find(s => s._id === serviceId);
            if (!service) return;

            const sheetContent = document.getElementById('sheetContent');
            sheetContent.innerHTML = \`
                <div class="detail-item">
                    <span class="detail-label">اسم الخدمة</span>
                    <div class="detail-value">\${service.name}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">مدة الخدمة</span>
                    <div class="detail-value">\${service.duration} دقيقة</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">سعر الخدمة</span>
                    <div class="detail-value">\${service.price} ريال</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ملاحظات</span>
                    <div class="detail-value">\${service.notes}</div>
                </div>
                <div class="sheet-actions">
                    <button class="btn-sheet-edit" onclick="editService('\${service._id}')"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="btn-sheet-delete" onclick="deleteService('\${service._id}')"><i class="fas fa-trash-alt"></i> حذف</button>
                </div>
            \`;

            document.getElementById('bottomSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        function closeSheet() {
            document.getElementById('bottomSheet').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        }

        function editService(serviceId) {
            window.location.href = '/services/edit/' + serviceId;
        }

        function deleteService(serviceId) {
            if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
                window.location.href = '/services/delete/' + serviceId;
            }
        }
    </script>
</body>
</html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <div style="text-align:center; padding:50px; direction:rtl;">
        <h3 style="color:#dc3545;">خطأ</h3>
        <p>${error.message}</p>
        <a href="/services" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
      </div>
    `);
  }
});

// نموذج إضافة خدمة جديدة (بنفس التصميم)
router.get('/new', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  const durationOptions = allowedDurations.map(d => 
    `<option value="${d}">${d} دقيقة</option>`
  ).join('');

  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إضافة خدمة</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { font-family: 'Inter', sans-serif; }
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
            max-width: 600px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h2 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2rem;
        }
        h2 i {
            margin-left: 10px;
            color: #FFD700;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            color: white;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .form-group label i {
            margin-left: 5px;
            color: #FFD700;
        }
        .form-control, .form-select {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255,255,255,0.9);
            border: 2px solid transparent;
            border-radius: 40px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .form-control:focus, .form-select:focus {
            outline: none;
            border-color: #FFD700;
            background: white;
        }
        textarea.form-control {
            border-radius: 20px;
            resize: vertical;
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
            margin-top: 10px;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .btn-secondary-custom {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 40px;
            padding: 15px 30px;
            font-weight: 600;
            width: 100%;
            text-decoration: none;
            display: block;
            text-align: center;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        .btn-secondary-custom:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-3px);
        }
        .flex-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        .flex-buttons .btn-primary-custom, .flex-buttons .btn-secondary-custom {
            margin-top: 0;
        }
        @media (max-width: 768px) {
            .glass-card { padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="glass-card">
        <h2><i class="fas fa-plus-circle"></i> إضافة خدمة جديدة</h2>
        <form method="POST" action="/services">
            <div class="form-group">
                <label><i class="fas fa-tag"></i> اسم الخدمة</label>
                <input type="text" name="name" class="form-control" placeholder="مثال: استشارة قانونية" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> مدة الخدمة</label>
                <select name="duration" class="form-select" required>
                    <option value="">اختر المدة</option>
                    ${durationOptions}
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-money-bill"></i> سعر الخدمة</label>
                <input type="number" name="price" class="form-control" placeholder="مثال: 200" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-sticky-note"></i> ملاحظات (اختياري)</label>
                <textarea name="notes" class="form-control" rows="4" placeholder="مثال: سيتم إرسال رابط الاجتماع عبر الواتساب..."></textarea>
            </div>
            <div class="flex-buttons">
                <button type="submit" class="btn-primary-custom"><i class="fas fa-save"></i> حفظ الخدمة</button>
                <a href="/services" class="btn-secondary-custom"><i class="fas fa-times"></i> إلغاء</a>
            </div>
        </form>
    </div>
</body>
</html>
  `);
});

// معالجة إضافة خدمة جديدة
router.post('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const { name, duration, price, notes } = req.body;
    const durationNum = parseInt(duration);
    if (!allowedDurations.includes(durationNum)) {
      return res.status(400).send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>المدة غير مسموحة. المدد المسموحة: ${allowedDurations.join('، ')} دقيقة.</p>
          <a href="/services/new" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    const service = new Service({
      professionalId: req.session.userId,
      name,
      duration: durationNum,
      price,
      notes
    });
    await service.save();
    
    res.redirect('/services?success=added');
  } catch (error) {
    res.status(500).send(`
      <div style="text-align:center; padding:50px; direction:rtl;">
        <h3 style="color:#FF7675;">خطأ</h3>
        <p>${error.message}</p>
        <a href="/services/new" class="btn-primary-custom" style="margin-top:20px;">محاولة مرة أخرى</a>
      </div>
    `);
  }
});

// نموذج تعديل خدمة
router.get('/edit/:id', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const service = await Service.findOne({ _id: req.params.id, professionalId: req.session.userId });
    if (!service) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>الخدمة غير موجودة</p>
          <a href="/services" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    const durationOptions = allowedDurations.map(d => 
      `<option value="${d}" ${service.duration === d ? 'selected' : ''}>${d} دقيقة</option>`
    ).join('');

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تعديل خدمة</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { font-family: 'Inter', sans-serif; }
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
            max-width: 600px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h2 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2rem;
        }
        h2 i {
            margin-left: 10px;
            color: #FFD700;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            color: white;
            margin-bottom: 8px;
            font-weight: 500;
        }
        .form-group label i {
            margin-left: 5px;
            color: #FFD700;
        }
        .form-control, .form-select {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255,255,255,0.9);
            border: 2px solid transparent;
            border-radius: 40px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .form-control:focus, .form-select:focus {
            outline: none;
            border-color: #FFD700;
            background: white;
        }
        textarea.form-control {
            border-radius: 20px;
            resize: vertical;
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
            margin-top: 10px;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .btn-secondary-custom {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 40px;
            padding: 15px 30px;
            font-weight: 600;
            width: 100%;
            text-decoration: none;
            display: block;
            text-align: center;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        .btn-secondary-custom:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-3px);
        }
        .flex-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        .flex-buttons .btn-primary-custom, .flex-buttons .btn-secondary-custom {
            margin-top: 0;
        }
        @media (max-width: 768px) {
            .glass-card { padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="glass-card">
        <h2><i class="fas fa-edit"></i> تعديل الخدمة</h2>
        <form method="POST" action="/services/edit/${service._id}">
            <div class="form-group">
                <label><i class="fas fa-tag"></i> اسم الخدمة</label>
                <input type="text" name="name" class="form-control" value="${service.name}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> مدة الخدمة</label>
                <select name="duration" class="form-select" required>
                    <option value="">اختر المدة</option>
                    ${durationOptions}
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-money-bill"></i> سعر الخدمة</label>
                <input type="number" name="price" class="form-control" value="${service.price}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-sticky-note"></i> ملاحظات</label>
                <textarea name="notes" class="form-control" rows="4">${service.notes || ''}</textarea>
            </div>
            <div class="flex-buttons">
                <button type="submit" class="btn-primary-custom"><i class="fas fa-save"></i> تحديث الخدمة</button>
                <a href="/services" class="btn-secondary-custom"><i class="fas fa-times"></i> إلغاء</a>
            </div>
        </form>
    </div>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send(`
      <div style="text-align:center; padding:50px; direction:rtl;">
        <h3 style="color:#FF7675;">خطأ</h3>
        <p>${error.message}</p>
        <a href="/services" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
      </div>
    `);
  }
});

// معالجة تعديل خدمة
router.post('/edit/:id', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const { name, duration, price, notes } = req.body;
    const durationNum = parseInt(duration);
    if (!allowedDurations.includes(durationNum)) {
      return res.status(400).send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>المدة غير مسموحة. المدد المسموحة: ${allowedDurations.join('، ')} دقيقة.</p>
          <a href="/services/edit/${req.params.id}" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    await Service.updateOne(
      { _id: req.params.id, professionalId: req.session.userId },
      { name, duration: durationNum, price, notes }
    );
    res.redirect('/services?success=updated');
  } catch (error) {
    res.status(500).send(`
      <div style="text-align:center; padding:50px; direction:rtl;">
        <h3 style="color:#FF7675;">خطأ</h3>
        <p>${error.message}</p>
        <a href="/services" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
      </div>
    `);
  }
});

// حذف خدمة
router.get('/delete/:id', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    await Service.deleteOne({ _id: req.params.id, professionalId: req.session.userId });
    res.redirect('/services?success=deleted');
  } catch (error) {
    res.status(500).send(`
      <div style="text-align:center; padding:50px; direction:rtl;">
        <h3 style="color:#FF7675;">خطأ</h3>
        <p>${error.message}</p>
        <a href="/services" class="btn-primary-custom" style="margin-top:20px;">عودة</a>
      </div>
    `);
  }
});

module.exports = router;