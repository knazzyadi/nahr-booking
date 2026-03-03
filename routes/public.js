const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { createNotification } = require('../utils/notifications');

// دالة للتحقق من توفر فترة زمنية
async function isTimeSlotAvailable(professionalId, startTime, endTime, excludeBookingId = null) {
  const query = {
    professionalId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflictingBooking = await Booking.findOne(query);
  return !conflictingBooking;
}

// الصفحة العامة للمهني
router.get('/p/:professionalId', async (req, res) => {
  try {
    const professional = await User.findOne({ 
      _id: req.params.professionalId, 
      role: 'professional' 
    });
    if (!professional) return res.send('المستخدم غير موجود');

    const services = await Service.find({ professionalId: professional._id });
    
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0,5);

    const availabilities = await Availability.find({ 
      professionalId: professional._id,
      date: { $gte: new Date(currentDateStr) }
    }).sort({ date: 1 });

    const futureAvailabilities = availabilities.filter(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      if (dateStr > currentDateStr) return true;
      if (dateStr < currentDateStr) return false;
      return a.endTime > currentTimeStr;
    });

    const upcomingBookings = await Booking.find({
      professionalId: professional._id,
      startTime: { $gte: now },
      status: { $in: ['pending', 'confirmed'] }
    }).select('startTime endTime');

    const bookingsData = upcomingBookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime
    }));

    const daysMap = new Map();
    futureAvailabilities.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, []);
      }
      daysMap.get(dateStr).push({
        start: a.startTime,
        end: a.endTime
      });
    });

    const days = Array.from(daysMap).map(([date, slots]) => ({ date, slots }));

    let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${professional.name}</title>
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
        .profile-header {
            position: relative;
            margin-bottom: 80px;
        }
        .cover-container {
            height: 200px;
            background-image: url('${professional.coverImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}');
            background-size: cover;
            background-position: center;
            border-radius: 40px 40px 40px 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
        }
        .avatar-container {
            position: absolute;
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;
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
        .profile-info {
            text-align: center;
            margin-bottom: 40px;
        }
        .profile-info h3 {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 700;
            color: white;
            font-size: 2rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .profile-info p {
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        .bio {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 25px;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: white;
            line-height: 1.8;
            font-size: 1rem;
        }
        .section-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 600;
            color: white;
            margin: 40px 0 20px;
            font-size: 1.5rem;
            text-align: center;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
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
            margin-bottom: 10px;
        }
        .service-info p {
            color: rgba(255,255,255,0.9);
            margin-bottom: 5px;
        }
        .service-info small {
            color: rgba(255,255,255,0.7);
        }
        /* Bottom Sheets (مع تصميم زجاجي) */
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
        .day-btn {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border: none;
            border-radius: 20px;
            padding: 18px 25px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            text-align: right;
            font-size: 1.1rem;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
        }
        .day-btn:hover {
            transform: translateX(-5px);
            box-shadow: 0 6px 20px rgba(108, 92, 231, 0.4);
        }
        .day-btn small {
            display: block;
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        .time-slot-btn {
            margin: 5px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #00CEC9, #00b894);
            border: none;
            border-radius: 30px;
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 206, 201, 0.3);
        }
        .time-slot-btn:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 6px 15px rgba(0, 206, 201, 0.5);
        }
        .time-slot-btn.booked {
            background: linear-gradient(135deg, #FF7675, #d63031);
            box-shadow: 0 4px 10px rgba(255, 118, 117, 0.3);
            cursor: not-allowed;
            opacity: 0.7;
        }
        .btn-primary-custom {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 12px 25px;
            font-weight: 600;
            width: 100%;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .form-control {
            width: 100%;
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 30px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            background: white;
        }
        .form-control:focus {
            outline: none;
            border-color: #6C5CE7;
            box-shadow: 0 0 0 4px rgba(108, 92, 231, 0.1);
        }
        /* تنسيق حقل الجوال الموحد */
        .phone-wrapper {
            display: flex;
            align-items: center;
            border: 2px solid #e0e0e0;
            border-radius: 30px;
            overflow: hidden;
            background: white;
        }
        .phone-prefix {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            color: white;
            padding: 10px 15px;
            font-weight: 500;
            border-left: 2px solid rgba(255,255,255,0.2);
            white-space: nowrap;
        }
        .phone-input {
            border: none;
            border-radius: 0;
            padding: 10px 15px;
            flex: 1;
            background: white;
            color: #2D3436;
            font-size: 0.95rem;
        }
        .phone-input:focus {
            outline: none;
            box-shadow: inset 0 0 0 2px #6C5CE7;
        }
        .phone-input::placeholder {
            color: #9CA3AF;
            opacity: 1;
        }
        /* مسافات بين الحقول */
        .field-gap {
            margin-bottom: 0.75rem; /* ربع المسافة الأصلية تقريباً */
        }
        .button-gap {
            margin-top: 0.75rem;
        }
        @media (max-width: 768px) {
            .cover-container { height: 150px; }
            .avatar-container { bottom: -40px; }
            .avatar { width: 80px; height: 80px; }
            .profile-info h3 { font-size: 1.5rem; }
            .services-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="profile-header">
        <div class="cover-container"></div>
        <div class="avatar-container">
            <img src="${professional.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80'}" alt="${professional.name}" class="avatar">
        </div>
    </div>
    <div class="profile-info">
        <h3>${professional.name}</h3>
        <p>${professional.profession || ''}</p>
        <div class="bio">
            ${professional.bio || '✨ مرحباً! أنا هنا لتقديم أفضل الخدمات. احجز موعدك الآن.'}
        </div>
    </div>

    <h2 class="section-title">الخدمات المتاحة</h2>
    <div class="services-grid" id="servicesContainer"></div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeAllSheets()"></div>

    <!-- Bottom Sheet لاختيار اليوم -->
    <div class="bottom-sheet" id="daySheet">
        <div class="sheet-header">
            <h5 id="daySheetTitle">اختر اليوم</h5>
            <button class="sheet-close" onclick="closeSheet('daySheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body" id="daySheetBody"></div>
    </div>

    <!-- Bottom Sheet لاختيار الوقت -->
    <div class="bottom-sheet" id="timeSheet">
        <div class="sheet-header">
            <h5 id="timeSheetTitle">اختر الوقت</h5>
            <button class="sheet-close" onclick="closeSheet('timeSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body" id="timeSheetBody"></div>
    </div>

    <!-- Bottom Sheet لنموذج الحجز -->
    <div class="bottom-sheet" id="bookingSheet">
        <div class="sheet-header">
            <h5>إكمال الحجز</h5>
            <button class="sheet-close" onclick="closeSheet('bookingSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body" id="bookingSheetBody"></div>
    </div>

    <script>
        const professionalId = '${professional._id}';
        const services = ${JSON.stringify(services.map(s => ({
            _id: s._id.toString(),
            name: s.name,
            duration: s.duration,
            price: s.price,
            notes: s.notes || ''
        })))};
        const daysData = ${JSON.stringify(days)};
        const bookingsData = ${JSON.stringify(bookingsData.map(b => ({
            startTime: new Date(b.startTime).toISOString(),
            endTime: new Date(b.endTime).toISOString()
        })))};

        let selectedService = null;
        let selectedDate = null;
        let selectedTime = null;

        function renderServices() {
            const container = document.getElementById('servicesContainer');
            if (services.length === 0) {
                container.innerHTML = '<p style="color:white; text-align:center;">لا توجد خدمات متاحة حالياً.</p>';
                return;
            }
            let html = '';
            services.forEach(s => {
                html += \`
                    <div class="service-card" onclick="selectService('\${s._id}')">
                        <div class="service-info">
                            <h5>\${s.name}</h5>
                            <p><i class="fas fa-clock"></i> المدة: \${s.duration} دقيقة</p>
                            <p><i class="fas fa-tag"></i> السعر: \${s.price} ريال</p>
                            \${s.notes ? '<small><i class="fas fa-info-circle"></i> ' + s.notes + '</small>' : ''}
                        </div>
                    </div>
                \`;
            });
            container.innerHTML = html;
        }

        function selectService(serviceId) {
            selectedService = services.find(s => s._id === serviceId);
            if (!selectedService) return;

            if (daysData.length === 0) {
                alert('لا توجد مواعيد متاحة حالياً.');
                return;
            }

            let dayHtml = '<p style="color:#2D3436; margin-bottom:15px;">اختر اليوم المناسب:</p>';
            daysData.forEach(d => {
                const dObj = new Date(d.date + 'T12:00:00');
                const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dObj.getDay()];
                const formattedDate = dObj.toLocaleDateString('ar-EG');
                dayHtml += \`
                    <div class="day-btn" onclick="selectDay('\${d.date}')">
                        <strong>\${dayName}</strong>
                        <small>\${formattedDate}</small>
                    </div>
                \`;
            });

            document.getElementById('daySheetTitle').innerText = \`اختر يوم لـ \${selectedService.name}\`;
            document.getElementById('daySheetBody').innerHTML = dayHtml;
            openSheet('daySheet');
        }

        function selectDay(date) {
            selectedDate = date;
            const dayData = daysData.find(d => d.date === date);
            if (!dayData) return;

            const duration = selectedService.duration;
            const slots = [];

            const bookedSlots = bookingsData.filter(b => {
                const bDate = new Date(b.startTime).toISOString().split('T')[0];
                return bDate === date;
            }).map(b => ({
                start: new Date(b.startTime),
                end: new Date(b.endTime)
            }));

            dayData.slots.forEach(period => {
                const startPeriod = new Date(date + 'T' + period.start + ':00');
                const endPeriod = new Date(date + 'T' + period.end + ':00');
                let current = new Date(startPeriod);
                while (current < endPeriod) {
                    const slotStart = new Date(current);
                    const slotEnd = new Date(current.getTime() + duration * 60000);
                    if (slotEnd > endPeriod) break;

                    const isBooked = bookedSlots.some(b => slotStart < b.end && slotEnd > b.start);
                    slots.push({
                        start: slotStart.toTimeString().substring(0,5),
                        end: slotEnd.toTimeString().substring(0,5),
                        isBooked
                    });
                    current = new Date(current.getTime() + duration * 60000);
                }
            });

            if (slots.length === 0) {
                alert('لا توجد أوقات متاحة في هذا اليوم.');
                return;
            }

            let timeHtml = '<p style="color:#2D3436; margin-bottom:15px;">اختر الوقت المناسب:</p>';
            slots.forEach(slot => {
                const btnClass = slot.isBooked ? 'time-slot-btn booked' : 'time-slot-btn';
                const disabled = slot.isBooked ? 'disabled' : '';
                timeHtml += \`<button class="\${btnClass}" \${disabled} onclick="selectTime('\${slot.start}', '\${slot.end}')">\${slot.start}</button>\`;
            });

            document.getElementById('timeSheetTitle').innerText = \`اختر وقت لـ \${selectedService.name}\`;
            document.getElementById('timeSheetBody').innerHTML = timeHtml;
            closeSheet('daySheet');
            openSheet('timeSheet');
        }

        function selectTime(startTime, endTime) {
            selectedTime = { start: startTime, end: endTime };
            closeSheet('timeSheet');
            showBookingForm();
        }

        function showBookingForm() {
            const html = \`
                <div class="text-center" style="margin-bottom:20px;">
                    <p style="color:#2D3436; margin:5px 0;"><strong>الخدمة:</strong> \${selectedService.name}</p>
                    <p style="color:#2D3436; margin:5px 0;"><strong>التاريخ:</strong> \${new Date(selectedDate + 'T12:00:00').toLocaleDateString('ar-EG')}</p>
                    <p style="color:#2D3436; margin:5px 0;"><strong>الوقت:</strong> \${selectedTime.start} - \${selectedTime.end}</p>
                </div>
                <form id="bookingForm">
                    <div class="field-gap">
                        <input type="text" class="form-control" id="clientName" required placeholder="الاسم الكامل">
                    </div>
                    <div class="field-gap">
                        <input type="email" class="form-control" id="clientEmail" required placeholder="البريد الإلكتروني">
                    </div>
                    <div class="field-gap">
                        <div class="phone-wrapper">
                            <span class="phone-prefix">+966</span>
                            <input type="tel" class="phone-input" id="clientPhone" placeholder="5xxxxxxxx" pattern="[5][0-9]{8}" required>
                        </div>
                    </div>
                    <button type="button" class="btn-primary-custom button-gap" onclick="submitBooking()">تأكيد الحجز</button>
                </form>
            \`;
            document.getElementById('bookingSheetBody').innerHTML = html;
            openSheet('bookingSheet');
        }

        function submitBooking() {
            const clientName = document.getElementById('clientName').value;
            const clientEmail = document.getElementById('clientEmail').value;
            const clientPhone = document.getElementById('clientPhone').value;

            if (!clientName || !clientEmail || !clientPhone) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }

            const phoneRegex = /^[5][0-9]{8}$/;
            if (!phoneRegex.test(clientPhone)) {
                alert('رقم الجوال غير صحيح. يجب أن يبدأ بـ 5 ويتكون من 9 أرقام.');
                return;
            }

            const fullPhone = '+966' + clientPhone;
            const startDateTime = new Date(selectedDate + 'T' + selectedTime.start + ':00');
            const endDateTime = new Date(selectedDate + 'T' + selectedTime.end + ':00');

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/book';

            const fields = {
                professionalId: professionalId,
                serviceId: selectedService._id,
                clientName,
                clientEmail,
                clientPhone: fullPhone,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            };

            for (const [key, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
        }

        function openSheet(sheetId) {
            document.getElementById(sheetId).classList.add('show');
            document.getElementById('overlay').classList.add('show');
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

        window.onload = renderServices;
    </script>
</body>
</html>
    `;
    res.send(html);
  } catch (error) {
    res.send('حدث خطأ: ' + error.message);
  }
});

// معالجة الحجز
router.post('/book', async (req, res) => {
  try {
    const { professionalId, serviceId, clientName, clientEmail, clientPhone, startTime, endTime } = req.body;

    const professional = await User.findById(professionalId);
    const service = await Service.findById(serviceId);
    
    if (!professional || !service) return res.send('المهني أو الخدمة غير موجودة');

    const requestedDuration = (new Date(endTime) - new Date(startTime)) / 60000;
    if (requestedDuration !== service.duration) return res.send('مدة الحجز لا تتطابق مع مدة الخدمة');

    const isAvailable = await isTimeSlotAvailable(professionalId, new Date(startTime), new Date(endTime));
    if (!isAvailable) return res.send('الوقت المحدد غير متاح، يرجى اختيار وقت آخر');

    const initialStatus = professional.autoConfirm ? 'confirmed' : 'pending';
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    const booking = new Booking({
      professionalId,
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: initialStatus,
      confirmationToken
    });

    await booking.save();

    await createNotification(
      professionalId,
      'booking_created',
      'حجز جديد',
      `تم إنشاء حجز جديد بواسطة ${clientName}`,
      { bookingId: booking._id }
    );

    let emailSubject, emailHtml;
    if (professional.autoConfirm) {
      emailSubject = '✅ تم تأكيد حجزك تلقائياً';
      emailHtml = `<h1>مرحباً ${clientName}</h1><p>تم تأكيد حجزك مع ${professional.name}.</p>`;
    } else {
      emailSubject = '⏳ طلب حجز قيد المراجعة';
      emailHtml = `<h1>مرحباً ${clientName}</h1><p>تم استلام طلب حجزك مع ${professional.name} وسيتم مراجعته قريباً.</p>`;
    }

    await sendEmail({ to: clientEmail, subject: emailSubject, html: emailHtml });

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تم الحجز</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .glass-card { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border-radius: 30px; padding: 40px; max-width: 500px; margin: 20px; border: 1px solid rgba(255,255,255,0.18); color: white; text-align: center; }
        .btn-primary-custom { background: linear-gradient(135deg, #6C5CE7, #a363d9); border: none; color: white; border-radius: 40px; padding: 12px 30px; font-weight: 600; text-decoration: none; display: inline-block; margin-top: 20px; }
        .btn-primary-custom:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(108,92,231,0.5); }
    </style>
</head>
<body>
    <div class="glass-card">
        <i class="fas fa-check-circle" style="font-size: 4rem; color: #00CEC9; margin-bottom: 20px;"></i>
        <h2>تم استلام الحجز بنجاح!</h2>
        <p>شكراً لك، ${clientName}. تم حجز موعدك مع ${professional.name}.</p>
        <p>تم إرسال تفاصيل الحجز إلى بريدك الإلكتروني.</p>
        <a href="/p/${professionalId}" class="btn-primary-custom">العودة للصفحة السابقة</a>
    </div>
</body>
</html>
    `);
  } catch (error) {
    console.error(error);
    res.send('حدث خطأ أثناء الحجز: ' + error.message);
  }
});

// إلغاء الحجز
router.get('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ confirmationToken: req.params.token })
      .populate('professionalId')
      .populate('serviceId');
      
    if (!booking) return res.send('رمز غير صالح');
    if (booking.status === 'cancelled') return res.send('الحجز ملغي بالفعل');
    
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
      html: `<h1>مرحباً ${booking.clientName}</h1><p>تم إلغاء حجزك مع ${booking.professionalId.name}.</p>`
    });

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تم الإلغاء</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .glass-card { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border-radius: 30px; padding: 40px; max-width: 500px; margin: 20px; border: 1px solid rgba(255,255,255,0.18); color: white; text-align: center; }
        .btn-primary-custom { background: linear-gradient(135deg, #6C5CE7, #a363d9); border: none; color: white; border-radius: 40px; padding: 12px 30px; font-weight: 600; text-decoration: none; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="glass-card">
        <i class="fas fa-times-circle" style="font-size: 4rem; color: #FF7675; margin-bottom: 20px;"></i>
        <h2>تم إلغاء الحجز</h2>
        <p>تم إلغاء الحجز بنجاح.</p>
        <a href="/" class="btn-primary-custom">العودة للصفحة الرئيسية</a>
    </div>
</body>
</html>
    `);
  } catch (error) {
    res.send('حدث خطأ');
  }
});

module.exports = router;