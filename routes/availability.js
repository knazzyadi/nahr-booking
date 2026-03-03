const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Schedule = require('../models/Schedule');

const allowedDurations = [15, 30, 45, 60];

// عرض صفحة إعدادات المواعيد
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    let schedule = await Schedule.findOne({ professionalId: req.session.userId });
    if (!schedule) {
      schedule = new Schedule({ professionalId: req.session.userId });
      await schedule.save();
    }

    const daysObj = {};
    for (let [key, value] of schedule.days.entries()) {
      daysObj[key] = value;
    }

    const dayNames = {
      1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس',
      5: 'الجمعة', 6: 'السبت', 0: 'الأحد'
    };

    const daysOrder = [1, 2, 3, 4, 5, 6, 0];

    // بناء بطاقات الأيام
    const dayCards = daysOrder.map(day => {
      const d = daysObj[day] || { enabled: false, startHour: '09', startMin: '00', endHour: '17', endMin: '00' };
      const badgeClass = d.enabled ? 'badge-active' : 'badge-inactive';
      const statusText = d.enabled ? 'نشط' : 'غير نشط';
      const timeText = d.enabled ? `${d.startHour}:${d.startMin} - ${d.endHour}:${d.endMin}` : '--:-- - --:--';
      return `
        <div class="day-card ${d.enabled ? 'active' : 'inactive'}" data-day="${day}" onclick="openDaySheet(${day})">
          <div class="day-info">
            <h6>${dayNames[day]}</h6>
            <span class="time-text">${timeText}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="status-badge ${badgeClass}">${statusText}</span>
            <i class="fas fa-info-circle info-icon" onclick="event.stopPropagation(); openDaySheet(${day})"></i>
          </div>
        </div>
      `;
    }).join('');

    res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعدادات المواعيد</title>
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
        .setting-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 20px 25px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .setting-card:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.35);
        }
        .setting-info h6 {
            color: white;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        .setting-info p {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        .chevron-icon {
            color: #FFD700;
            font-size: 1.2rem;
        }
        .day-card {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 20px 25px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .day-card:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.35);
        }
        .day-card.active {
            border-right: 8px solid #00b894;
        }
        .day-card.inactive {
            border-right: 8px solid #ff7675;
        }
        .day-info h6 {
            color: white;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        .time-text {
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        .status-badge {
            padding: 5px 12px;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .badge-active {
            background: #00b894;
            color: white;
            box-shadow: 0 2px 10px rgba(0,184,148,0.3);
        }
        .badge-inactive {
            background: #ff7675;
            color: white;
            box-shadow: 0 2px 10px rgba(255,118,117,0.3);
        }
        .info-icon {
            color: #FFD700;
            font-size: 1.2rem;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .info-icon:hover {
            transform: scale(1.2);
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
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
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
        .form-switch .form-check-input {
            width: 3em;
            height: 1.5em;
        }
        .form-check-input:checked {
            background-color: #00b894;
            border-color: #00b894;
        }
        .time-selector {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 15px;
        }
        .time-selector select {
            padding: 10px;
            border-radius: 30px;
            border: 1px solid #ddd;
            background: white;
        }
        .btn-sheet {
            background: linear-gradient(135deg, #6C5CE7, #a363d9);
            border: none;
            color: white;
            border-radius: 40px;
            padding: 12px 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        .btn-sheet:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(108,92,231,0.4);
        }
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
            color: #00b894;
            font-size: 1.2rem;
        }
        .toast-custom.error i {
            color: #ff7675;
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
        <span class="navbar-brand"><i class="fas fa-clock"></i> إعدادات المواعيد</span>
        <a href="/dashboard" class="btn-back"><i class="fas fa-arrow-right"></i> عودة</a>
    </div>

    <!-- Toast container -->
    <div class="toast-container" id="toastContainer" style="display: none;">
        <div class="toast-custom" id="toastMessage">
            <i class="fas fa-check-circle"></i>
            <span id="toastBody">✅ تم حفظ المواعيد بنجاح!</span>
        </div>
    </div>

    <div style="max-width: 800px; margin: 0 auto;">
        <!-- بطاقة مدة الخدمة -->
        <div class="setting-card" onclick="openDurationSheet()">
            <div class="setting-info">
                <h6><i class="fas fa-hourglass-half" style="margin-left:8px;"></i> مدة الخدمة</h6>
                <p id="durationDisplay">${schedule.duration} دقيقة</p>
            </div>
            <i class="fas fa-chevron-left chevron-icon" onclick="event.stopPropagation(); openDurationSheet()"></i>
        </div>

        <!-- بطاقة التكرار -->
        <div class="setting-card" onclick="openRecurrenceSheet()">
            <div class="setting-info">
                <h6><i class="fas fa-redo-alt" style="margin-left:8px;"></i> التكرار</h6>
                <p id="recurrenceDisplay">${schedule.recurrence === 'weekly' ? 'أسبوعي' : 'لا يتكرر'}</p>
            </div>
            <i class="fas fa-chevron-left chevron-icon" onclick="event.stopPropagation(); openRecurrenceSheet()"></i>
        </div>

        <!-- بطاقات الأيام -->
        <h5 style="color: white; margin: 20px 0 10px;">أيام العمل</h5>
        ${dayCards}

        <!-- زر الحفظ -->
        <button class="btn-primary-custom" onclick="submitSettings()">حفظ الإعدادات</button>
    </div>

    <!-- Overlay -->
    <div class="overlay" id="overlay" onclick="closeAllSheets()"></div>

    <!-- Bottom Sheet للمدة -->
    <div class="bottom-sheet" id="durationSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-hourglass-half"></i> مدة الخدمة</h5>
            <button class="sheet-close" onclick="closeSheet('durationSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:15px;">اختر المدة الزمنية لكل خدمة:</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${allowedDurations.map(d => `
                    <button class="btn-sheet" onclick="selectDuration(${d})" style="background: #f0f0f0; color: #2D3436;">${d} دقيقة</button>
                `).join('')}
            </div>
        </div>
    </div>

    <!-- Bottom Sheet للتكرار -->
    <div class="bottom-sheet" id="recurrenceSheet">
        <div class="sheet-header">
            <h5><i class="fas fa-redo-alt"></i> التكرار</h5>
            <button class="sheet-close" onclick="closeSheet('recurrenceSheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body">
            <p style="color:#2D3436; margin-bottom:15px;">اختر نمط التكرار:</p>
            <button class="btn-sheet" onclick="selectRecurrence('weekly')" style="background: #f0f0f0; color: #2D3436; margin-bottom:10px;">أسبوعي</button>
            <button class="btn-sheet" onclick="selectRecurrence('none')" style="background: #f0f0f0; color: #2D3436;">لا يتكرر</button>
        </div>
    </div>

    <!-- Bottom Sheet لليوم -->
    <div class="bottom-sheet" id="daySheet">
        <div class="sheet-header">
            <h5 id="daySheetTitle"><i class="fas fa-calendar-day"></i> تعديل اليوم</h5>
            <button class="sheet-close" onclick="closeSheet('daySheet')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-body" id="daySheetBody"></div>
    </div>

    <script>
        // البيانات المحفوظة من الخادم
        const savedSettings = {
            duration: ${schedule.duration},
            recurrence: '${schedule.recurrence}',
            days: ${JSON.stringify(daysObj)}
        };

        let settings = savedSettings;

        const dayNames = {
            1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس',
            5: 'الجمعة', 6: 'السبت', 0: 'الأحد'
        };

        function createHourOptions(selectedHour) {
            let options = '';
            for (let i = 0; i < 24; i++) {
                let hour = i.toString().padStart(2, '0');
                options += '<option value="' + hour + '"' + (hour === selectedHour ? ' selected' : '') + '>' + hour + '</option>';
            }
            return options;
        }
        function createMinuteOptions(selectedMin) {
            let options = '';
            const minutes = ['00', '15', '30', '45'];
            minutes.forEach(m => {
                options += '<option value="' + m + '"' + (m === selectedMin ? ' selected' : '') + '>' + m + '</option>';
            });
            return options;
        }

        function updateDayCard(day) {
            const card = document.querySelector('.day-card[data-day="'+day+'"]');
            if (!card) return;
            const dayData = settings.days[day];
            const timeText = dayData.enabled ? dayData.startHour+':'+dayData.startMin+' - '+dayData.endHour+':'+dayData.endMin : '--:-- - --:--';
            card.querySelector('.time-text').innerText = timeText;
            const badge = card.querySelector('.status-badge');
            if (dayData.enabled) {
                badge.className = 'status-badge badge-active';
                badge.innerText = 'نشط';
                card.classList.remove('inactive');
                card.classList.add('active');
            } else {
                badge.className = 'status-badge badge-inactive';
                badge.innerText = 'غير نشط';
                card.classList.remove('active');
                card.classList.add('inactive');
            }
        }

        function updateDisplay() {
            document.getElementById('durationDisplay').innerText = settings.duration + ' دقيقة';
            document.getElementById('recurrenceDisplay').innerText = settings.recurrence === 'weekly' ? 'أسبوعي' : 'لا يتكرر';
        }

        function openDurationSheet() {
            document.getElementById('durationSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }
        function openRecurrenceSheet() {
            document.getElementById('recurrenceSheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        let currentOpenDay = undefined;

        function openDaySheet(day) {
            const dayData = settings.days[day];
            const title = dayNames[day];
            document.getElementById('daySheetTitle').innerText = title;
            
            let html = \`
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="dayEnabled" \${dayData.enabled ? 'checked' : ''}>
                    <label class="form-check-label" for="dayEnabled" style="color:#2D3436;">تفعيل اليوم</label>
                </div>
                <div id="timeFields" \${!dayData.enabled ? 'style="display:none;"' : ''}>
                    <div style="margin-bottom:15px;">
                        <label style="color:#2D3436; display:block; margin-bottom:5px;">من</label>
                        <div class="time-selector">
                            <select id="startHour" style="flex:1;">
                                \${createHourOptions(dayData.startHour)}
                            </select>
                            <span>:</span>
                            <select id="startMin" style="flex:1;">
                                \${createMinuteOptions(dayData.startMin)}
                            </select>
                        </div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="color:#2D3436; display:block; margin-bottom:5px;">إلى</label>
                        <div class="time-selector">
                            <select id="endHour" style="flex:1;">
                                \${createHourOptions(dayData.endHour)}
                            </select>
                            <span>:</span>
                            <select id="endMin" style="flex:1;">
                                \${createMinuteOptions(dayData.endMin)}
                            </select>
                        </div>
                    </div>
                </div>
                <button class="btn-sheet" onclick="saveDaySettings(\${day})">حفظ</button>
            \`;
            document.getElementById('daySheetBody').innerHTML = html;

            document.getElementById('dayEnabled').addEventListener('change', function(e) {
                const timeFields = document.getElementById('timeFields');
                const enabled = e.target.checked;
                timeFields.style.display = enabled ? 'block' : 'none';
                settings.days[day].enabled = enabled;
            });

            ['startHour', 'startMin', 'endHour', 'endMin'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', function() {
                        const value = this.value;
                        if (id === 'startHour') settings.days[day].startHour = value;
                        else if (id === 'startMin') settings.days[day].startMin = value;
                        else if (id === 'endHour') settings.days[day].endHour = value;
                        else if (id === 'endMin') settings.days[day].endMin = value;
                    });
                }
            });

            currentOpenDay = day;
            document.getElementById('daySheet').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        }

        function closeSheet(sheetId) {
            document.getElementById(sheetId).classList.remove('show');
            if (sheetId === 'daySheet' && currentOpenDay !== undefined) {
                updateDayCard(currentOpenDay);
                currentOpenDay = undefined;
            }
            if (!document.querySelector('.bottom-sheet.show')) {
                document.getElementById('overlay').classList.remove('show');
            }
        }

        function closeAllSheets() {
            document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('show'));
            document.getElementById('overlay').classList.remove('show');
            if (currentOpenDay !== undefined) {
                updateDayCard(currentOpenDay);
                currentOpenDay = undefined;
            }
        }

        function selectDuration(d) {
            settings.duration = d;
            updateDisplay();
            closeSheet('durationSheet');
        }

        function selectRecurrence(r) {
            settings.recurrence = r;
            updateDisplay();
            closeSheet('recurrenceSheet');
        }

        function submitSettings() {
            const enabledDays = Object.values(settings.days).filter(d => d.enabled).length;
            if (enabledDays === 0) {
                alert('يجب تفعيل يوم واحد على الأقل.');
                return;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/availability';

            const durationInput = document.createElement('input');
            durationInput.type = 'hidden';
            durationInput.name = 'duration';
            durationInput.value = settings.duration;
            form.appendChild(durationInput);

            const recurrenceInput = document.createElement('input');
            recurrenceInput.type = 'hidden';
            recurrenceInput.name = 'recurrence';
            recurrenceInput.value = settings.recurrence;
            form.appendChild(recurrenceInput);

            for (let day = 0; day <= 6; day++) {
                const d = settings.days[day];
                if (d.enabled) {
                    const enabledInput = document.createElement('input');
                    enabledInput.type = 'hidden';
                    enabledInput.name = 'enabled_' + day;
                    enabledInput.value = '1';
                    form.appendChild(enabledInput);

                    const startHour = document.createElement('input');
                    startHour.type = 'hidden';
                    startHour.name = 'startHour_' + day;
                    startHour.value = d.startHour;
                    form.appendChild(startHour);

                    const startMin = document.createElement('input');
                    startMin.type = 'hidden';
                    startMin.name = 'startMin_' + day;
                    startMin.value = d.startMin;
                    form.appendChild(startMin);

                    const endHour = document.createElement('input');
                    endHour.type = 'hidden';
                    endHour.name = 'endHour_' + day;
                    endHour.value = d.endHour;
                    form.appendChild(endHour);

                    const endMin = document.createElement('input');
                    endMin.type = 'hidden';
                    endMin.name = 'endMin_' + day;
                    endMin.value = d.endMin;
                    form.appendChild(endMin);
                }
            }

            document.body.appendChild(form);
            form.submit();
        }

        function showToast(message, isSuccess = true) {
            const toastContainer = document.getElementById('toastContainer');
            const toastBody = document.getElementById('toastBody');
            const toastMessage = document.getElementById('toastMessage');
            
            toastBody.innerText = message;
            if (isSuccess) {
                toastMessage.querySelector('i').className = 'fas fa-check-circle';
            } else {
                toastMessage.querySelector('i').className = 'fas fa-exclamation-circle';
            }
            
            toastContainer.style.display = 'block';
            setTimeout(() => {
                toastContainer.style.display = 'none';
            }, 3000);
        }

        window.onload = function() {
            updateDisplay();
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('saved') && urlParams.get('saved') === '1') {
                showToast('✅ تم حفظ المواعيد بنجاح!');
                const url = new URL(window.location);
                url.searchParams.delete('saved');
                window.history.replaceState({}, document.title, url);
            } else if (urlParams.has('error') && urlParams.get('error') === '1') {
                showToast('❌ حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.', false);
                const url = new URL(window.location);
                url.searchParams.delete('error');
                window.history.replaceState({}, document.title, url);
            }
        };
    </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('خطأ في تحميل الصفحة: ' + error.message);
  }
});

// معالجة حفظ الإعدادات (POST)
router.post('/', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    console.log('📥 البيانات الواردة:', req.body);

    const days = {};
    for (let day = 0; day <= 6; day++) {
      if (req.body[`enabled_${day}`]) {
        days[day] = {
          enabled: true,
          startHour: req.body[`startHour_${day}`],
          startMin: req.body[`startMin_${day}`],
          endHour: req.body[`endHour_${day}`],
          endMin: req.body[`endMin_${day}`]
        };
      } else {
        days[day] = {
          enabled: false,
          startHour: '09',
          startMin: '00',
          endHour: '17',
          endMin: '00'
        };
      }
    }

    await Schedule.findOneAndUpdate(
      { professionalId: req.session.userId },
      {
        duration: parseInt(req.body.duration),
        recurrence: req.body.recurrence,
        days: days
      },
      { upsert: true, new: true }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Availability.deleteMany({
      professionalId: req.session.userId,
      date: { $gte: today }
    });

    const recurrence = req.body.recurrence;
    const weeks = recurrence === 'weekly' ? 12 : 1;

    const startDate = new Date(today);
    const dayOfWeek = today.getDay();
    if (dayOfWeek !== 1) {
      const daysUntilMonday = (8 - dayOfWeek) % 7;
      startDate.setDate(today.getDate() + daysUntilMonday);
    }

    let savedCount = 0;

    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day <= 6; day++) {
        const enabled = req.body[`enabled_${day}`];
        if (!enabled) continue;

        const startHour = req.body[`startHour_${day}`];
        const startMin = req.body[`startMin_${day}`];
        const endHour = req.body[`endHour_${day}`];
        const endMin = req.body[`endMin_${day}`];

        if (!startHour || !startMin || !endHour || !endMin) continue;

        const startTime = `${startHour}:${startMin}`;
        const endTime = `${endHour}:${endMin}`;
        if (startTime >= endTime) continue;

        const appointmentDate = new Date(startDate);
        appointmentDate.setDate(startDate.getDate() + (week * 7) + day);
        appointmentDate.setHours(0, 0, 0, 0);

        const availability = new Availability({
          professionalId: req.session.userId,
          date: appointmentDate,
          startTime,
          endTime
        });
        await availability.save();
        savedCount++;
      }
    }

    console.log('✅ تم حفظ', savedCount, 'موعد');

    if (savedCount === 0) {
      return res.redirect('/availability?error=1');
    }

    res.redirect('/availability?saved=1');
  } catch (error) {
    console.error('❌ خطأ في الحفظ:', error);
    res.redirect('/availability?error=1');
  }
});

module.exports = router;