const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const { createNotification } = require('../utils/notifications');

// عرض جميع حجوزات المهني المسجل مع فلترة
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    // جلب جميع الحجوزات مع الخدمة
    const bookings = await Booking.find({ professionalId: req.session.userId })
      .populate('serviceId')
      .sort({ startTime: -1 });

    // الحصول على الوقت الحالي
    const now = new Date();

    // تصنيف الحجوزات
    const confirmed = [];
    const cancelled = [];
    const expired = [];

    bookings.forEach(b => {
      const endTime = new Date(b.endTime);
      if (b.status === 'confirmed' && endTime < now) {
        expired.push(b);
      } else if (b.status === 'confirmed') {
        confirmed.push(b);
      } else if (b.status === 'cancelled') {
        cancelled.push(b);
      } else {
        // pending
        confirmed.push(b);
      }
    });

    let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الحجوزات</title>
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
        /* شريط البحث والفلتر */
        .search-section {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            align-items: center;
        }
        .search-box {
            flex: 1;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 40px;
            padding: 5px 5px 5px 20px;
            display: flex;
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .search-box i {
            color: #FFD700;
            font-size: 1.2rem;
            margin-left: 10px;
        }
        .search-box input {
            flex: 1;
            background: transparent;
            border: none;
            padding: 15px 0;
            color: white;
            font-size: 1rem;
        }
        .search-box input::placeholder {
            color: rgba(255,255,255,0.7);
        }
        .search-box input:focus {
            outline: none;
        }
        .filter-container {
            position: relative;
        }
        .filter-btn {
            width: 55px;
            height: 55px;
            background: rgba(255,255,255,0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.3rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .filter-btn:hover {
            background: rgba(255,255,255,0.4);
            transform: scale(1.05);
        }
        .filter-btn.active {
            background: #6C5CE7;
            border-color: #6C5CE7;
        }
        .filter-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            left: 0;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 10px;
            min-width: 200px;
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 100;
            display: none;
        }
        .filter-dropdown.show {
            display: block;
        }
        .filter-item {
            padding: 12px 15px;
            border-radius: 15px;
            color: #2D3436;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-item:hover {
            background: rgba(108, 92, 231, 0.1);
        }
        .filter-item.active {
            background: #6C5CE7;
            color: white;
        }
        .filter-item .badge {
            background: rgba(0,0,0,0.1);
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        .filter-item.active .badge {
            background: rgba(255,255,255,0.2);
            color: white;
        }
        /* بطاقة الحجز */
        .booking-card {
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
        .booking-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.35);
        }
        .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .client-name {
            color: white;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
        }
        .info-icon {
            width: 40px;
            height: 40px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFD700;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.3);
            cursor: pointer;
        }
        .info-icon:hover {
            background: rgba(255,255,255,0.4);
            transform: scale(1.1);
        }
        .booking-details {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .booking-time {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 600;
            width: fit-content;
        }
        .status-confirmed {
            background: #00b894;
            color: white;
        }
        .status-cancelled {
            background: #ff7675;
            color: white;
        }
        .status-expired {
            background: #636e72;
            color: white;
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
        .btn-sheet-confirm {
            flex: 1;
            background: linear-gradient(135deg, #00b894, #00cec9);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-sheet-confirm:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,184,148,0.4);
        }
        .btn-sheet-cancel {
            flex: 1;
            background: linear-gradient(135deg, #ff7675, #d63031);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-sheet-cancel:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(255,118,117,0.4);
        }
        .no-results {
            color: white;
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 30px;
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
            .search-section {
                gap: 10px;
            }
            .filter-btn {
                width: 50px;
                height: 50px;
            }
        }
    </style>
</head>
<body>
    <div class="navbar">
        <span class="navbar-brand"><i class="fas fa-calendar-alt"></i> الحجوزات</span>
        <a href="/dashboard" class="btn-back"><i class="fas fa-arrow-right"></i> عودة</a>
    </div>

    <!-- شريط البحث والفلتر -->
    <div class="search-section">
        <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="searchInput" placeholder="بحث بالاسم أو البريد أو رقم الهاتف...">
        </div>
        <div class="filter-container">
            <button class="filter-btn" id="filterBtn">
                <i class="fas fa-filter"></i>
            </button>
            <div class="filter-dropdown" id="filterDropdown">
                <div class="filter-item active" data-filter="all">
                    <span>الكل</span>
                    <span class="badge">${bookings.length}</span>
                </div>
                <div class="filter-item" data-filter="confirmed">
                    <span>مؤكد</span>
                    <span class="badge">${confirmed.length}</span>
                </div>
                <div class="filter-item" data-filter="cancelled">
                    <span>ملغي</span>
                    <span class="badge">${cancelled.length}</span>
                </div>
                <div class="filter-item" data-filter="expired">
                    <span>منتهي</span>
                    <span class="badge">${expired.length}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- حاوية الحجوزات -->
    <div id="bookingsContainer"></div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeSheet()"></div>

    <!-- Bottom Sheet للتفاصيل -->
    <div class="bottom-sheet" id="bottomSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-info-circle"></i> تفاصيل الحجز</h5>
            <button class="sheet-close" onclick="closeSheet()"><i class="fas fa-times"></i></button>
        </div>
        <div id="sheetContent"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // بيانات الحجوزات
        const bookingsData = ${JSON.stringify(bookings.map(b => {
            const endTime = new Date(b.endTime);
            const now = new Date();
            let computedStatus = b.status;
            if (b.status === 'confirmed' && endTime < now) {
                computedStatus = 'expired';
            }
            return {
                _id: b._id.toString(),
                clientName: b.clientName,
                clientEmail: b.clientEmail,
                clientPhone: b.clientPhone,
                serviceName: b.serviceId ? b.serviceId.name : 'غير معروفة',
                serviceDuration: b.serviceId ? b.serviceId.duration : 'غير معروفة',
                startTime: new Date(b.startTime).toLocaleString('ar-EG'),
                notes: b.notes || 'لا توجد ملاحظات',
                status: computedStatus,
                rawStartTime: b.startTime,
                rawEndTime: b.endTime
            };
        }))};

        let currentFilter = 'all';
        let searchTerm = '';

        // عناصر الفلتر
        const filterBtn = document.getElementById('filterBtn');
        const filterDropdown = document.getElementById('filterDropdown');
        const filterItems = document.querySelectorAll('.filter-item');

        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
            filterBtn.classList.toggle('active');
        });

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('show');
                filterBtn.classList.remove('active');
            }
        });

        // اختيار عنصر الفلتر
        filterItems.forEach(item => {
            item.addEventListener('click', function() {
                currentFilter = this.dataset.filter;
                filterItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                renderBookings();
                filterDropdown.classList.remove('show');
                filterBtn.classList.remove('active');
            });
        });

        function getFilteredBookings() {
            let filtered = bookingsData;

            if (currentFilter !== 'all') {
                filtered = filtered.filter(b => b.status === currentFilter);
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(b => 
                    b.clientName.toLowerCase().includes(term) ||
                    b.clientEmail.toLowerCase().includes(term) ||
                    b.clientPhone.includes(term)
                );
            }

            return filtered;
        }

        function renderBookings() {
            const filtered = getFilteredBookings();
            const container = document.getElementById('bookingsContainer');
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="no-results">لا توجد حجوزات تطابق معايير البحث.</div>';
                return;
            }

            let html = '';
            filtered.forEach(b => {
                let statusClass = '';
                let statusText = '';
                if (b.status === 'confirmed') {
                    statusClass = 'status-confirmed';
                    statusText = 'مؤكد';
                } else if (b.status === 'cancelled') {
                    statusClass = 'status-cancelled';
                    statusText = 'ملغي';
                } else if (b.status === 'expired') {
                    statusClass = 'status-expired';
                    statusText = 'منتهي';
                } else {
                    statusClass = 'status-confirmed';
                    statusText = 'معلق';
                }

                html += \`
                    <div class="booking-card" onclick="openSheet('\${b._id}')">
                        <div class="booking-header">
                            <h6 class="client-name">\${b.clientName}</h6>
                            <div class="info-icon" onclick="event.stopPropagation(); openSheet('\${b._id}')">
                                <i class="fas fa-info"></i>
                            </div>
                        </div>
                        <div class="booking-details">
                            <div class="booking-time"><i class="fas fa-clock"></i> \${b.startTime}</div>
                            <span class="status-badge \${statusClass}">\${statusText}</span>
                        </div>
                    </div>
                \`;
            });
            container.innerHTML = html;
        }

        document.getElementById('searchInput').addEventListener('input', function(e) {
            searchTerm = e.target.value;
            renderBookings();
        });

        function openSheet(bookingId) {
            const booking = bookingsData.find(b => b._id === bookingId);
            if (!booking) return;

            const now = new Date();
            const endTime = new Date(booking.rawEndTime);
            const isExpired = (booking.status === 'confirmed' && endTime < now) || booking.status === 'expired';
            const confirmButton = (booking.status === 'pending' && !isExpired) 
                ? '<button class="btn-sheet-confirm" onclick="confirmBooking(\\'' + booking._id + '\\')"><i class="fas fa-check"></i> تأكيد الحجز</button>'
                : '';

            const cancelButton = (booking.status !== 'cancelled' && !isExpired) 
                ? '<button class="btn-sheet-cancel" onclick="cancelBooking(\\'' + booking._id + '\\')"><i class="fas fa-times"></i> إلغاء الحجز</button>'
                : '';

            const sheetContent = document.getElementById('sheetContent');
            sheetContent.innerHTML = \`
                <div class="detail-item">
                    <span class="detail-label">اسم العميل</span>
                    <div class="detail-value">\${booking.clientName}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">البريد الإلكتروني</span>
                    <div class="detail-value">\${booking.clientEmail}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">رقم الهاتف</span>
                    <div class="detail-value">\${booking.clientPhone}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">الخدمة</span>
                    <div class="detail-value">\${booking.serviceName} (\${booking.serviceDuration} دقيقة)</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">تاريخ ووقت الحجز</span>
                    <div class="detail-value">\${booking.startTime}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ملاحظات</span>
                    <div class="detail-value">\${booking.notes}</div>
                </div>
                <div class="sheet-actions">
                    \${confirmButton}
                    \${cancelButton}
                </div>
            \`;

            document.getElementById('bottomSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        function closeSheet() {
            document.getElementById('bottomSheet').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        }

        function confirmBooking(bookingId) {
            window.location.href = '/bookings/confirm/' + bookingId;
        }

        function cancelBooking(bookingId) {
            if (confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) {
                window.location.href = '/bookings/cancel/' + bookingId;
            }
        }

        window.onload = renderBookings;
    </script>
</body>
</html>
    `;
    res.send(html);
  } catch (error) {
    res.send('خطأ في تحميل الحجوزات');
  }
});

// تأكيد الحجز من قبل المهني
router.get('/confirm/:id', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate('professionalId');
      
    if (!booking) return res.send('الحجز غير موجود');
    if (booking.professionalId._id.toString() !== req.session.userId) {
      return res.send('غير مصرح لك بتأكيد هذا الحجز');
    }

    booking.status = 'confirmed';
    await booking.save();

    await createNotification(
      booking.professionalId._id,
      'booking_confirmed',
      'تم تأكيد الحجز',
      `تم تأكيد حجز ${booking.clientName}`,
      { bookingId: booking._id }
    );

    await sendEmail({
      to: booking.clientEmail,
      subject: '✅ تم تأكيد حجزك',
      html: `<h1>مرحباً ${booking.clientName}</h1>
             <p>تم تأكيد حجزك مع ${booking.professionalId.name}.</p>
             <p>التاريخ: ${new Date(booking.startTime).toLocaleString('ar-EG')}</p>`
    });

    res.redirect('/bookings');
  } catch (error) {
    res.send('خطأ في تأكيد الحجز');
  }
});

// إلغاء الحجز من قبل المهني
router.get('/cancel/:id', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate('professionalId');
      
    if (!booking) return res.send('الحجز غير موجود');
    if (booking.professionalId._id.toString() !== req.session.userId) {
      return res.send('غير مصرح لك بإلغاء هذا الحجز');
    }

    booking.status = 'cancelled';
    await booking.save();

    await createNotification(
      booking.professionalId._id,
      'booking_cancelled',
      'تم إلغاء الحجز',
      `تم إلغاء حجز ${booking.clientName}`,
      { bookingId: booking._id }
    );

    await sendEmail({
      to: booking.clientEmail,
      subject: '❌ تم إلغاء حجزك',
      html: `<h1>مرحباً ${booking.clientName}</h1>
             <p>تم إلغاء حجزك مع ${booking.professionalId.name}.</p>`
    });

    res.redirect('/bookings');
  } catch (error) {
    res.send('خطأ في إلغاء الحجز');
  }
});

module.exports = router;