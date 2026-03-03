const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// صفحة تسجيل المهنيين (بتصميم عصري)
router.get('/register', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل جديد</title>
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
            max-width: 450px;
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
        .input-group {
            margin-bottom: 20px;
        }
        .input-group label {
            display: block;
            color: rgba(255,255,255,0.9);
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 0.95rem;
        }
        .input-group label i {
            margin-left: 5px;
            color: #FFD700;
        }
        .input-group input,
        .input-group select,
        .input-group textarea {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255,255,255,0.9);
            border: 2px solid transparent;
            border-radius: 40px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        .input-group input:focus,
        .input-group select:focus,
        .input-group textarea:focus {
            outline: none;
            border-color: #FFD700;
            background: white;
        }
        .phone-wrapper {
            display: flex;
        }
        .country-code {
            background: rgba(255,255,255,0.9);
            border: 2px solid transparent;
            border-radius: 40px 0 0 40px;
            padding: 15px 20px;
            color: #2D3436;
            font-weight: 500;
            border-left: none;
        }
        .phone-input {
            border-radius: 0 40px 40px 0 !important;
        }
        .error-message {
            color: #FF7675;
            font-size: 0.9rem;
            margin-top: 5px;
            display: none;
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
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .footer-link {
            text-align: center;
            margin-top: 20px;
            color: rgba(255,255,255,0.8);
        }
        .footer-link a {
            color: #FFD700;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .footer-link a:hover {
            text-decoration: underline;
            color: white;
        }
        @media (max-width: 480px) {
            .glass-card { padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="glass-card">
        <h2><i class="fas fa-user-plus"></i> تسجيل مهني جديد</h2>
        <form method="POST" action="/auth/register" id="registerForm" onsubmit="return validateForm()">
            <div class="input-group">
                <label><i class="fas fa-user"></i> الاسم</label>
                <input type="text" name="name" placeholder="الاسم الكامل" required>
            </div>
            <div class="input-group">
                <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                <input type="email" name="email" placeholder="example@domain.com" required>
            </div>
            <div class="input-group">
                <label><i class="fas fa-briefcase"></i> المهنة</label>
                <input type="text" name="profession" placeholder="مثال: محامي, طبيب, حلاق ..." required>
            </div>
            <div class="input-group">
                <label><i class="fas fa-phone"></i> رقم الجوال</label>
                <div class="phone-wrapper">
                    <span class="country-code">+966</span>
                    <input type="tel" name="phone" class="phone-input" placeholder="5xxxxxxxx" pattern="[5][0-9]{8}" required>
                </div>
                <div class="error-message" id="phoneError">رقم الجوال غير صحيح. يجب أن يبدأ بـ 5 ويتكون من 9 أرقام.</div>
            </div>
            <div class="input-group">
                <label><i class="fas fa-lock"></i> كلمة المرور</label>
                <input type="password" name="password" placeholder="********" required>
            </div>
            <button type="submit" class="btn-primary-custom"><i class="fas fa-check-circle"></i> تسجيل</button>
        </form>
        <div class="footer-link">
            لديك حساب بالفعل؟ <a href="/auth/login">تسجيل الدخول</a>
        </div>
    </div>

    <script>
        function validateForm() {
            const phoneInput = document.querySelector('input[name="phone"]');
            const phoneError = document.getElementById('phoneError');
            const phoneRegex = /^[5][0-9]{8}$/;
            if (!phoneRegex.test(phoneInput.value)) {
                phoneError.style.display = 'block';
                return false;
            }
            phoneError.style.display = 'none';
            return true;
        }

        // السماح فقط بالأرقام
        document.querySelector('input[name="phone"]').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    </script>
</body>
</html>
  `);
});

// معالجة بيانات التسجيل (نفس المنطق)
router.post('/register', async (req, res) => {
  try {
    const { name, email, profession, phone, password } = req.body;
    
    const phoneRegex = /^[5][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>رقم الجوال غير صحيح. يجب أن يبدأ بـ 5 ويتكون من 9 أرقام.</p>
          <a href="/auth/register" class="btn-primary-custom" style="background: linear-gradient(135deg, #6C5CE7, #a363d9); color:white; padding:10px 20px; border-radius:40px; text-decoration:none; display:inline-block; margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    const fullPhone = `+966${phone}`;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>البريد الإلكتروني مستخدم بالفعل</p>
          <a href="/auth/register" class="btn-primary-custom" style="background: linear-gradient(135deg, #6C5CE7, #a363d9); color:white; padding:10px 20px; border-radius:40px; text-decoration:none; display:inline-block; margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      phone: fullPhone,
      password: hashedPassword,
      profession,
      role: 'professional',
      autoConfirm: true
    });
    
    await user.save();
    
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تم التسجيل</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
              body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
              .glass-card { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px); border-radius: 30px; padding: 40px; max-width: 500px; text-align: center; border: 1px solid rgba(255,255,255,0.18); }
              h2 { color: white; margin-bottom: 20px; }
              p { color: rgba(255,255,255,0.9); margin-bottom: 30px; }
              .btn-primary-custom { background: linear-gradient(135deg, #6C5CE7, #a363d9); border: none; color: white; border-radius: 40px; padding: 12px 30px; font-weight: 600; text-decoration: none; display: inline-block; }
              .btn-primary-custom:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(108,92,231,0.5); }
          </style>
      </head>
      <body>
          <div class="glass-card">
              <i class="fas fa-check-circle" style="font-size: 4rem; color: #00CEC9; margin-bottom: 20px;"></i>
              <h2>✅ تم التسجيل بنجاح!</h2>
              <p>يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور.</p>
              <a href="/auth/login" class="btn-primary-custom">تسجيل الدخول</a>
          </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.send('حدث خطأ أثناء التسجيل');
  }
});

// صفحة تسجيل الدخول (بتصميم عصري)
router.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل الدخول</title>
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
            max-width: 400px;
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
        .input-group {
            margin-bottom: 20px;
        }
        .input-group label {
            display: block;
            color: rgba(255,255,255,0.9);
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 0.95rem;
        }
        .input-group label i {
            margin-left: 5px;
            color: #FFD700;
        }
        .input-group input {
            width: 100%;
            padding: 15px 20px;
            background: rgba(255,255,255,0.9);
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
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .checkbox-group input {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        .checkbox-group label {
            color: rgba(255,255,255,0.9);
            cursor: pointer;
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
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(108, 92, 231, 0.5);
        }
        .footer-link {
            text-align: center;
            margin-top: 20px;
            color: rgba(255,255,255,0.8);
        }
        .footer-link a {
            color: #FFD700;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .footer-link a:hover {
            text-decoration: underline;
            color: white;
        }
    </style>
</head>
<body>
    <div class="glass-card">
        <h2><i class="fas fa-sign-in-alt"></i> تسجيل الدخول</h2>
        <form method="POST" action="/auth/login">
            <div class="input-group">
                <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                <input type="email" name="email" placeholder="example@domain.com" required>
            </div>
            <div class="input-group">
                <label><i class="fas fa-lock"></i> كلمة المرور</label>
                <input type="password" name="password" placeholder="********" required>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" name="rememberMe" id="rememberMe" checked>
                <label for="rememberMe">تذكرني (البقاء متصلاً)</label>
            </div>
            <button type="submit" class="btn-primary-custom"><i class="fas fa-arrow-left"></i> دخول</button>
        </form>
        <div class="footer-link">
            ليس لديك حساب؟ <a href="/auth/register">سجل الآن</a>
        </div>
    </div>
</body>
</html>
  `);
});

// معالجة تسجيل الدخول (نفس المنطق)
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>البريد الإلكتروني أو كلمة المرور غير صحيحة</p>
          <a href="/auth/login" class="btn-primary-custom" style="background: linear-gradient(135deg, #6C5CE7, #a363d9); color:white; padding:10px 20px; border-radius:40px; text-decoration:none; display:inline-block; margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    if (user.role === 'professional' && user.isActive === false) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>حسابك موقوف مؤقتاً، يرجى التواصل مع الإدارة</p>
          <a href="/auth/login" class="btn-primary-custom" style="background: linear-gradient(135deg, #6C5CE7, #a363d9); color:white; padding:10px 20px; border-radius:40px; text-decoration:none; display:inline-block; margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send(`
        <div style="text-align:center; padding:50px; direction:rtl;">
          <h3 style="color:#FF7675;">خطأ</h3>
          <p>البريد الإلكتروني أو كلمة المرور غير صحيحة</p>
          <a href="/auth/login" class="btn-primary-custom" style="background: linear-gradient(135deg, #6C5CE7, #a363d9); color:white; padding:10px 20px; border-radius:40px; text-decoration:none; display:inline-block; margin-top:20px;">عودة</a>
        </div>
      `);
    }
    
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    
    if (rememberMe === 'on') {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }
    
    res.redirect('/dashboard');
  } catch (error) {
    res.send('حدث خطأ أثناء تسجيل الدخول');
  }
});

module.exports = router;