// Chaiboard - Industrial Beverage Intelligence Platform & Client Engine
(function() {
    // Initial demo student profiles (email-based, with class)
    const DEFAULT_STUDENTS = [
        {
            email: 'aarav@example.com',
            name: 'Aarav Sharma',
            password: 'chai1234',
            studentClass: 'CSA',
            year: '2',
            avatar: 'AS',
            cupsToday: 4,
            weeklyCups: 26,
            allTimeCups: 342,
            streak: 18,
            title: 'Chai Lord',
            logs: [
                { time: '08:45 AM', temp: 66, hash: '0xFA391823B1E40812', blend: 'Kadak Cutting Chai', sugar: 7.5 },
                { time: '11:30 AM', temp: 64, hash: '0xA71295D314C05671', blend: 'Masala Chai', sugar: 7.5 },
                { time: '02:15 PM', temp: 68, hash: '0xB89422F5128032AA', blend: 'Adrak Chai', sugar: 3.5 },
                { time: '05:40 PM', temp: 63, hash: '0x99238FF01A2548BC', blend: 'Elaichi Chai', sugar: 7.5 }
            ]
        },
        {
            email: 'priya@example.com',
            name: 'Priya Patel',
            password: 'chai1234',
            studentClass: 'ECA',
            year: '3',
            avatar: 'PP',
            cupsToday: 5,
            weeklyCups: 29,
            allTimeCups: 410,
            streak: 24,
            title: 'Tea Royalty',
            logs: [
                { time: '09:10 AM', temp: 67, hash: '0x342918820B1D4011', blend: 'Kadak Cutting Chai', sugar: 7.5 },
                { time: '12:05 PM', temp: 65, hash: '0x431294C314C05999', blend: 'Adrak Chai', sugar: 7.5 },
                { time: '03:30 PM', temp: 69, hash: '0x589422A512803111', blend: 'Masala Chai', sugar: 12.0 },
                { time: '06:15 PM', temp: 62, hash: '0x79238AA01A254222', blend: 'Kadak Cutting Chai', sugar: 3.5 },
                { time: '08:00 PM', temp: 64, hash: '0x88238EE01A254333', blend: 'Elaichi Chai', sugar: 0.0 }
            ]
        },
        {
            email: 'rohan@example.com',
            name: 'Rohan Verma',
            password: 'chai1234',
            studentClass: 'ME',
            year: '1',
            avatar: 'RV',
            cupsToday: 3,
            weeklyCups: 19,
            allTimeCups: 185,
            streak: 9,
            title: 'Chai Enthusiast',
            logs: [
                { time: '10:00 AM', temp: 65, hash: '0x1A2B3C4D5E6F7081', blend: 'Kadak Cutting Chai', sugar: 7.5 },
                { time: '01:45 PM', temp: 63, hash: '0x2B3C4D5E6F708192', blend: 'Adrak Chai', sugar: 7.5 },
                { time: '05:10 PM', temp: 67, hash: '0x3C4D5E6F708192A3', blend: 'Masala Chai', sugar: 7.5 }
            ]
        },
        {
            email: 'ananya@example.com',
            name: 'Ananya Deshmukh',
            password: 'chai1234',
            studentClass: 'CSB',
            year: '4',
            avatar: 'AD',
            cupsToday: 2,
            weeklyCups: 14,
            allTimeCups: 156,
            streak: 7,
            title: 'Chai Sipper',
            logs: [
                { time: '11:15 AM', temp: 64, hash: '0x4D5E6F708192A3B4', blend: 'Kadak Cutting Chai', sugar: 0.0 },
                { time: '04:20 PM', temp: 68, hash: '0x5E6F708192A3B4C5', blend: 'Elaichi Chai', sugar: 3.5 }
            ]
        },
        {
            email: 'vikram@example.com',
            name: 'Vikram Singh',
            password: 'chai1234',
            studentClass: 'EEE',
            year: '2',
            avatar: 'VS',
            cupsToday: 4,
            weeklyCups: 24,
            allTimeCups: 290,
            streak: 15,
            title: 'Kadak Fan',
            logs: [
                { time: '08:30 AM', temp: 65, hash: '0x6F708192A3B4C5D6', blend: 'Kadak Cutting Chai', sugar: 7.5 },
                { time: '12:40 PM', temp: 67, hash: '0x708192A3B4C5D6E7', blend: 'Masala Chai', sugar: 7.5 },
                { time: '03:55 PM', temp: 63, hash: '0x8192A3B4C5D6E7F8', blend: 'Adrak Chai', sugar: 7.5 },
                { time: '07:20 PM', temp: 66, hash: '0x92A3B4C5D6E7F809', blend: 'Elaichi Chai', sugar: 12.0 }
            ]
        }
    ];

    // Health Engine Baseline per cup
    const BASELINE = {
        calories: 45, // kcal
        sugar: 7.5,   // grams
        caffeine: 30, // mg
        volume: 100   // ml
    };

    // Industrial Thresholds
    const THRESHOLDS = {
        calories: {
            limit: 250,
            title: 'CALORIE CEILING BREACHED // CHILL OUT',
            quote: 'Bro you are drinking dessert at this point. Time to lock in some water.'
        },
        sugar: {
            limit: 30,
            title: 'SUGAR OVERCLOCK DETECTED // DON\'T CRASH OUT',
            quote: 'Insulin levels about to go crazy. Switch to sugarfree or you will fall asleep in mechanics class.'
        },
        caffeine: {
            limit: 150,
            title: 'CAFFEINE OVERCLOCK // MAXIMUM JITTERS',
            quote: 'You are vibrating on 300Hz frequency. Heart rate doing dubstep. Drink water real quick.'
        }
    };

    class ChaiboardApp {
        constructor() {
            this.students = this.loadStudents();
            this.currentStudent = null;
            this.hero3D = null;
            this.cameraAuth = new ChaiboardCameraAuth();
            this.activeLeaderboardTab = 'students';
            this.activeLeaderboardTier = 'daily';
            this.uploadedImageBase64 = null;

            this.initDOM();
            this.bindEvents();
            this.checkSessionOnStartup();
        }

        checkSessionOnStartup() {
            try {
                const sessionRaw = localStorage.getItem('chaiboard_active_session');
                if (sessionRaw) {
                    const session = JSON.parse(sessionRaw);
                    if (session && session.email) {
                        const student = this.students.find(s => s.email.toLowerCase() === session.email.toLowerCase());
                        if (student) {
                            this.setCurrentStudent(student);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.warn('Session restore error:', e);
            }
            // If no active session, ensure landing page is shown cleanly
            this.handleLogout(false);
        }

        initDOM() {
            this.landingWrapper = document.getElementById('landing-wrapper');
            this.authSection = document.getElementById('auth-section') || document.getElementById('login-section');
            this.loginSection = this.authSection; // Compatibility
            this.dashboardSection = document.getElementById('dashboard-section');

            // Auth tabs & panes
            this.tabBtnLogin = document.getElementById('tab-btn-login');
            this.tabBtnRegister = document.getElementById('tab-btn-register');
            this.paneLogin = document.getElementById('pane-login');
            this.paneRegister = document.getElementById('pane-register');
            this.linkToRegister = document.getElementById('link-to-register');
            this.linkToLogin = document.getElementById('link-to-login');

            this.loginForm = document.getElementById('login-form');
            this.registerForm = document.getElementById('register-form');
            this.logoutBtn = document.getElementById('logout-btn');
            this.switchStudentBtn = document.getElementById('switch-student-btn');

            // Nav elements
            this.navLinksLoggedOut = document.getElementById('nav-links-logged-out');
            this.navLinksLoggedIn = document.getElementById('nav-links-logged-in');
            this.navBtnScanQuick = document.getElementById('nav-btn-scan-quick');
            this.btnLockIn = document.getElementById('btn-lock-in');
            this.loggedStudentPill = document.getElementById('logged-student-pill');

            // Dashboard hero banner
            this.dashWelcomeName = document.getElementById('dash-welcome-name');
            this.btnDashScan = document.getElementById('btn-dash-scan');
            this.btnDashPass = document.getElementById('btn-dash-pass');

            // Camera / Scan Modal
            this.btnLogChai = document.getElementById('btn-log-chai');
            this.btnSlosh = document.getElementById('btn-slosh');
            this.cameraModal = document.getElementById('camera-modal');
            this.btnCloseCamera = document.getElementById('btn-close-camera');
            this.videoFeed = document.getElementById('camera-feed');
            this.capturePreview = document.getElementById('capture-preview');
            this.btnSnapChai = document.getElementById('btn-snap-chai');
            this.aiScannerStatus = document.getElementById('ai-scanner-status');
            this.verificationResults = document.getElementById('verification-results');

            // Pass Modal
            this.btnChaiPass = document.getElementById('btn-chai-pass');
            this.chaiPassModal = document.getElementById('chai-pass-modal');
            this.btnClosePass = document.getElementById('btn-close-pass');
            this.btnPrintPass = document.getElementById('btn-print-pass');

            this.toggleSoundBtn = document.getElementById('toggle-sound-btn');
        }

        switchAuthTab(tab) {
            if (tab === 'register') {
                if (this.tabBtnRegister) this.tabBtnRegister.classList.add('active');
                if (this.tabBtnLogin) this.tabBtnLogin.classList.remove('active');
                if (this.paneRegister) this.paneRegister.classList.remove('hidden');
                if (this.paneLogin) this.paneLogin.classList.add('hidden');
            } else {
                if (this.tabBtnLogin) this.tabBtnLogin.classList.add('active');
                if (this.tabBtnRegister) this.tabBtnRegister.classList.remove('active');
                if (this.paneLogin) this.paneLogin.classList.remove('hidden');
                if (this.paneRegister) this.paneRegister.classList.add('hidden');
            }
        }

        scrollToAuth(tab = 'login') {
            this.switchAuthTab(tab);
            if (this.landingWrapper) this.landingWrapper.classList.remove('hidden');
            if (this.authSection) {
                this.authSection.classList.remove('hidden');
                this.authSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        bindEvents() {
            // Tab switching
            if (this.tabBtnLogin) this.tabBtnLogin.addEventListener('click', () => this.switchAuthTab('login'));
            if (this.tabBtnRegister) this.tabBtnRegister.addEventListener('click', () => this.switchAuthTab('register'));
            if (this.linkToRegister) this.linkToRegister.addEventListener('click', () => this.switchAuthTab('register'));
            if (this.linkToLogin) this.linkToLogin.addEventListener('click', () => this.switchAuthTab('login'));

            // Smooth jump to auth from visitor nav & hero buttons
            const navLinkSignin = document.getElementById('nav-link-signin');
            if (navLinkSignin) navLinkSignin.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToAuth('login');
            });

            const navLinkCreate = document.getElementById('nav-link-create');
            if (navLinkCreate) navLinkCreate.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToAuth('register');
            });

            if (this.btnLockIn) {
                this.btnLockIn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToAuth('login');
                });
            }

            const heroSignInBtn = document.getElementById('hero-btn-signin');
            if (heroSignInBtn) {
                heroSignInBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToAuth('login');
                });
            }

            const heroRegisterBtn = document.getElementById('hero-btn-register');
            if (heroRegisterBtn) {
                heroRegisterBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToAuth('register');
                });
            }

            // Check URL parameters or hash on load
            if (window.location.search.includes('tab=register') || window.location.hash.includes('register')) {
                this.switchAuthTab('register');
            }

            const navBrandLink = document.getElementById('nav-brand-link');
            if (navBrandLink) {
                navBrandLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.currentStudent) {
                        const dashTop = document.getElementById('dashboard-top');
                        if (dashTop) dashTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        const heroEl = document.getElementById('hero');
                        if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }

            // Dashboard Pass trigger
            if (this.btnDashPass) this.btnDashPass.addEventListener('click', () => this.openPassModal());

            // Demo Profiles
            document.querySelectorAll('.demo-login-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    this.autoLoginDemo(email);
                });
            });

            // Forms
            if (this.loginForm) {
                this.loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email    = document.getElementById('login-email').value.trim();
                    const password = document.getElementById('login-password').value.trim();
                    this.handleLogin(email, password);
                });
            }

            if (this.registerForm) {
                this.registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            }

            if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());
            if (this.switchStudentBtn) this.switchStudentBtn.addEventListener('click', () => this.handleLogout());

            if (this.btnSlosh) {
                this.btnSlosh.addEventListener('click', () => {
                    if (this.hero3D) this.hero3D.triggerSlosh();
                });
            }

            if (this.btnCloseCamera) {
                this.btnCloseCamera.addEventListener('click', () => this.closeCameraFlow());
            }

            if (this.btnSnapChai) {
                this.btnSnapChai.addEventListener('click', () => this.runVerificationFlow('normal'));
            }

            const btnDup = document.getElementById('btn-test-duplicate');
            if (btnDup) {
                btnDup.addEventListener('click', () => this.runVerificationFlow('duplicate'));
            }

            const btnNonTea = document.getElementById('btn-test-nontea');
            if (btnNonTea) {
                btnNonTea.addEventListener('click', () => this.runVerificationFlow('non_tea'));
            }

            if (this.btnChaiPass) {
                this.btnChaiPass.addEventListener('click', () => this.openPassModal());
            }
            if (this.btnClosePass) {
                this.btnClosePass.addEventListener('click', () => this.closePassModal());
            }
            if (this.btnPrintPass) {
                this.btnPrintPass.addEventListener('click', () => window.print());
            }

            if (this.toggleSoundBtn) {
                this.toggleSoundBtn.addEventListener('click', () => {
                    if (!window.chaiAudio) return;
                    window.chaiAudio.soundEnabled = !window.chaiAudio.soundEnabled;
                    this.toggleSoundBtn.textContent = window.chaiAudio.soundEnabled ? 'Audio FX: Active' : 'Audio FX: Muted';
                });
            }

            document.querySelectorAll('.lb-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.activeLeaderboardTab = tab.getAttribute('data-target');
                    this.renderLeaderboard();
                });
            });

            const lbTier = document.getElementById('lb-tier-select');
            if (lbTier) {
                lbTier.addEventListener('change', (e) => {
                    this.activeLeaderboardTier = e.target.value;
                    this.renderLeaderboard();
                });
            }
        }

        loadStudents() {
            const saved = localStorage.getItem('chaiboard_students_v4');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) {}
            }
            return DEFAULT_STUDENTS;
        }

        saveStudents(data) {
            localStorage.setItem('chaiboard_students_v4', JSON.stringify(data));
        }

        async autoLoginDemo(email) {
            const student = this.students.find(s => s.email === email);
            if (student) {
                try {
                    await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: student.email, password: student.password || 'password123' })
                    });
                } catch (e) {}
                this.setCurrentStudent(student);
            }
        }

        async handleLogin(email, password) {
            if (!email || !password) {
                this.showToast('Please enter your email and password.');
                return;
            }

            // Sync with backend session
            let backendRole = null;
            let backendName = null;
            let backendDept = null;
            try {
                const apiRes = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (apiRes.ok) {
                    const data = await apiRes.json();
                    if (data.student) {
                        backendRole = data.student.role;
                        backendName = data.student.name;
                        backendDept = data.student.department;
                    }
                }
            } catch (e) {
                console.warn('Backend login sync error:', e);
            }

            let student = this.students.find(s => s.email.toLowerCase() === email.toLowerCase());
            if (student) {
                if (student.password && student.password !== password) {
                    this.showToast('Wrong password. Please try again.');
                    return;
                }
                if (backendRole) student.role = backendRole;
                if (backendName) student.name = backendName;
                if (backendDept && !student.studentClass) student.studentClass = backendDept;
                this.saveStudents(this.students);
            } else {
                const namePart = backendName || email.split('@')[0].replace(/[._]/g, ' ');
                const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                const initials = formattedName.substring(0, 2).toUpperCase() || 'CH';
                student = {
                    email: email.toLowerCase(),
                    name: formattedName,
                    password: password,
                    role: backendRole || (email.toLowerCase() === 'admin@chaiboard.com' ? 'admin' : 'student'),
                    studentClass: backendDept || 'CSA',
                    year: '1',
                    avatar: initials,
                    cupsToday: 0,
                    weeklyCups: 0,
                    allTimeCups: 0,
                    streak: 1,
                    title: (backendRole === 'admin' || email.toLowerCase() === 'admin@chaiboard.com') ? 'System Administrator' : 'Chai Enthusiast',
                    logs: []
                };
                this.students.push(student);
                this.saveStudents(this.students);
            }
            this.setCurrentStudent(student);
            this.showToast(`Welcome back, ${student.name}!`);
        }

        async handleRegister() {
            const nameEl     = document.getElementById('reg-name');
            const emailEl    = document.getElementById('reg-email');
            const clsEl      = document.getElementById('reg-class');
            const yearEl     = document.getElementById('reg-year');
            const pwdEl      = document.getElementById('reg-password');
            const pwdConfEl  = document.getElementById('reg-password-confirm');

            const name       = nameEl ? nameEl.value.trim() : '';
            const email      = emailEl ? emailEl.value.trim().toLowerCase() : '';
            const cls        = clsEl ? clsEl.value : 'CSA';
            const year       = yearEl ? yearEl.value : '1';
            const password   = pwdEl ? pwdEl.value.trim() : '';
            const confirmPwd = pwdConfEl ? pwdConfEl.value.trim() : password;

            if (!name || !email || !password) {
                this.showToast('Please fill in your name, email, and password.');
                return;
            }

            if (confirmPwd && password !== confirmPwd) {
                this.showToast('Passwords do not match. Please verify.');
                return;
            }

            // Sync with backend API
            try {
                fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, department: cls, password })
                }).catch(() => {});
            } catch (e) {}

            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CH';

            let student = this.students.find(s => s.email.toLowerCase() === email);
            if (student) {
                // Account already exists in local records: update info and log straight in!
                student.name = name;
                student.password = password;
                student.studentClass = cls;
                student.year = year;
                student.avatar = initials;
                this.saveStudents(this.students);
                this.setCurrentStudent(student);
                this.showToast(`Welcome back ${student.name}! Account updated & signed in.`);
            } else {
                student = {
                    email,
                    name,
                    password,
                    studentClass: cls,
                    year,
                    avatar: initials,
                    cupsToday: 0,
                    weeklyCups: 0,
                    allTimeCups: 0,
                    streak: 1,
                    title: 'Chai Enthusiast',
                    logs: []
                };
                this.students.push(student);
                this.saveStudents(this.students);
                this.setCurrentStudent(student);
                this.showToast(`Account created for ${student.name}! Ready to track.`);
            }
        }

        setCurrentStudent(student) {
            this.currentStudent = student;
            localStorage.setItem('chaiboard_active_session', JSON.stringify({ email: student.email }));

            // Collapse landing marketing view & auth hub
            if (this.landingWrapper) this.landingWrapper.classList.add('hidden');
            if (this.authSection) this.authSection.classList.add('hidden');
            if (this.dashboardSection) this.dashboardSection.classList.remove('hidden');

            // Switch navigation to logged-in mode
            if (this.navLinksLoggedIn) this.navLinksLoggedIn.classList.remove('hidden');
            if (this.navLinksLoggedOut) this.navLinksLoggedOut.classList.add('hidden');
            if (this.navBtnScanQuick) this.navBtnScanQuick.classList.remove('hidden');
            if (this.btnLockIn) this.btnLockIn.style.display = 'none';

            if (this.loggedStudentPill) this.loggedStudentPill.style.display = 'inline-flex';
            if (this.btnChaiPass) this.btnChaiPass.style.display = 'inline-flex';
            if (this.logoutBtn) this.logoutBtn.style.display = 'inline-flex';

            // Show admin buttons if user is admin
            const isAdmin = student.role === 'admin' || (student.email && student.email.toLowerCase() === 'admin@chaiboard.com');
            const navAdmin = document.getElementById('nav-admin-link');
            if (navAdmin) {
                if (isAdmin) navAdmin.classList.remove('hidden');
                else navAdmin.classList.add('hidden');
            }
            const bannerAdmin = document.getElementById('btn-dash-admin');
            if (bannerAdmin) {
                if (isAdmin) bannerAdmin.classList.remove('hidden');
                else bannerAdmin.classList.add('hidden');
            }

            if (this.dashWelcomeName) {
                this.dashWelcomeName.textContent = student.name.split(' ')[0] || student.name;
            }

            this.renderHeaderPill();
            this.renderStudentProfile();
            this.renderMetrics();
            this.renderHistory();
            this.renderLeaderboard();

            if (!this.hero3D) {
                this.hero3D = new Chai3DHero('chai-3d-container');
            }
            this.hero3D.setCupCount(this.currentStudent.cupsToday);

            // Immediate scroll to top: eliminates any blank page or scroll offsets
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        handleLogout(showNotification = true) {
            this.currentStudent = null;
            localStorage.removeItem('chaiboard_active_session');

            if (this.dashboardSection) this.dashboardSection.classList.add('hidden');
            if (this.landingWrapper) this.landingWrapper.classList.remove('hidden');
            if (this.authSection) this.authSection.classList.remove('hidden');

            const navAdmin = document.getElementById('nav-admin-link');
            if (navAdmin) navAdmin.classList.add('hidden');
            const bannerAdmin = document.getElementById('btn-dash-admin');
            if (bannerAdmin) bannerAdmin.classList.add('hidden');

            if (this.navLinksLoggedIn) this.navLinksLoggedIn.classList.add('hidden');
            if (this.navLinksLoggedOut) this.navLinksLoggedOut.classList.remove('hidden');
            if (this.navBtnScanQuick) this.navBtnScanQuick.classList.add('hidden');
            if (this.btnLockIn) this.btnLockIn.style.display = 'inline-flex';

            if (this.loggedStudentPill) this.loggedStudentPill.style.display = 'none';
            if (this.btnChaiPass) this.btnChaiPass.style.display = 'none';
            if (this.logoutBtn) this.logoutBtn.style.display = 'none';

            if (this.loginForm) this.loginForm.reset();
            if (this.registerForm) this.registerForm.reset();

            if (showNotification) {
                this.showToast('You have logged out.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        renderHeaderPill() {
            if (!this.currentStudent) return;
            document.getElementById('header-student-name').textContent = this.currentStudent.name;
            document.getElementById('header-student-meta').textContent = `${this.currentStudent.studentClass} Year ${this.currentStudent.year}`;
            document.getElementById('header-avatar').textContent = this.currentStudent.avatar || 'CH';
        }

        renderStudentProfile() {
            if (!this.currentStudent) return;
            document.getElementById('profile-name').textContent = this.currentStudent.name;
            document.getElementById('profile-title').textContent = this.currentStudent.title || 'Chai Enthusiast';
            document.getElementById('profile-roll').textContent = `${this.currentStudent.studentClass} · Year ${this.currentStudent.year}`;
            document.getElementById('profile-hostel').textContent = this.currentStudent.studentClass;
            document.getElementById('profile-dept').textContent = `Year ${this.currentStudent.year}`;
            document.getElementById('profile-streak').textContent = `${this.currentStudent.streak || 1} day streak`;
            document.getElementById('hero-cups-count').textContent = this.currentStudent.cupsToday;
            document.getElementById('hero-volume-count').textContent = `${this.currentStudent.cupsToday * 100} ml`;
        }

        renderMetrics() {
            if (!this.currentStudent) return;
            const cups = this.currentStudent.cupsToday;

            let calories = 0;
            let sugar = 0;
            let caffeine = 0;

            if (this.currentStudent.logs && this.currentStudent.logs.length > 0) {
                this.currentStudent.logs.forEach(l => {
                    calories += (l.calories !== undefined ? l.calories : BASELINE.calories);
                    sugar += (l.sugar !== undefined ? l.sugar : BASELINE.sugar);
                    caffeine += (l.caffeine !== undefined ? l.caffeine : BASELINE.caffeine);
                });
            } else {
                calories = cups * BASELINE.calories;
                sugar = cups * BASELINE.sugar;
                caffeine = cups * BASELINE.caffeine;
            }

            document.getElementById('metric-calories').textContent = `${calories.toFixed(0)} kcal`;
            document.getElementById('metric-sugar').textContent = `${sugar.toFixed(1)} g`;
            document.getElementById('metric-caffeine').textContent = `${caffeine.toFixed(0)} mg`;

            const calPct = Math.min(100, (calories / THRESHOLDS.calories.limit) * 100);
            const sugPct = Math.min(100, (sugar / THRESHOLDS.sugar.limit) * 100);
            const caffPct = Math.min(100, (caffeine / THRESHOLDS.caffeine.limit) * 100);

            const calBar = document.getElementById('bar-calories');
            const sugarBar = document.getElementById('bar-sugar');
            const caffBar = document.getElementById('bar-caffeine');

            calBar.style.width = `${calPct}%`;
            sugarBar.style.width = `${sugPct}%`;
            caffBar.style.width = `${caffPct}%`;

            const warnCal = document.getElementById('warn-calories');
            const warnSugar = document.getElementById('warn-sugar');
            const warnCaff = document.getElementById('warn-caffeine');

            if (calories > THRESHOLDS.calories.limit) {
                warnCal.innerHTML = `<span class="badge warning-badge" style="color:#f87171;">[ALERT] CALORIE LIMIT EXCEEDED</span><div class="quote-text">${THRESHOLDS.calories.quote}</div>`;
                warnCal.classList.remove('hidden');
                calBar.classList.add('bar-danger');
            } else {
                warnCal.classList.add('hidden');
                calBar.classList.remove('bar-danger');
            }

            if (sugar > THRESHOLDS.sugar.limit) {
                warnSugar.innerHTML = `<span class="badge warning-badge" style="color:#f87171;">[ALERT] GLYCEMIC LOAD CEILING</span><div class="quote-text">${THRESHOLDS.sugar.quote}</div>`;
                warnSugar.classList.remove('hidden');
                sugarBar.classList.add('bar-danger');
            } else {
                warnSugar.classList.add('hidden');
                sugarBar.classList.remove('bar-danger');
            }

            if (caffeine > THRESHOLDS.caffeine.limit) {
                warnCaff.innerHTML = `<span class="badge warning-badge" style="color:#f87171;">[ALERT] CAFFEINE SATURATION</span><div class="quote-text">${THRESHOLDS.caffeine.quote}</div>`;
                warnCaff.classList.remove('hidden');
                caffBar.classList.add('bar-danger');
            } else {
                warnCaff.classList.add('hidden');
                caffBar.classList.remove('bar-danger');
            }

            // Dispense temperature evaluation
            const tempBadge = document.getElementById('tongue-temp-badge');
            const tempQuote = document.getElementById('tongue-temp-quote');
            if (cups === 0) {
                tempBadge.textContent = 'STANDBY // READY FOR SIP';
                tempBadge.className = 'status-pill gray';
                tempQuote.textContent = 'Scan your cutting chai glass to start logging telemetry.';
            } else {
                const latestLog = this.currentStudent.logs[this.currentStudent.logs.length - 1];
                const temp = latestLog ? latestLog.temp : 65;
                if (temp > 67) {
                    tempBadge.textContent = `${temp}°C • TONGUE BURN RISK // WAIT A SEC`;
                    tempBadge.className = 'status-pill red';
                    tempQuote.textContent = 'Bro this chai is lava hot (>67°C). Blow on it before you crash out.';
                } else if (temp >= 55) {
                    tempBadge.textContent = `${temp}°C • CHAI SIPPING SWEET SPOT`;
                    tempBadge.className = 'status-pill green';
                    tempQuote.textContent = 'Crisp 65°C perfection. Sip with maximum rizz.';
                } else {
                    tempBadge.textContent = `${temp}°C • COLD TEA DETECTED // L + RATIO`;
                    tempBadge.className = 'status-pill orange';
                    tempQuote.textContent = 'Your chai is getting lukewarm. Drink it fast before it turns into iced tea.';
                }
            }
        }

        renderHistory() {
            if (!this.currentStudent) return;
            const listEl = document.getElementById('chai-history-list');
            listEl.innerHTML = '';

            const logs = this.currentStudent.logs || [];
            if (logs.length === 0) {
                listEl.innerHTML = '<div class="empty-state">No intake units logged today yet. Authenticate an image to begin.</div>';
                return;
            }

            [...logs].reverse().forEach((log, idx) => {
                const cupNumber = logs.length - idx;
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-left">
                        <div class="cup-icon" style="font-size: 0.82rem; font-weight: 800; color: var(--chai-amber);">UNIT #${cupNumber}</div>
                        <div>
                            <div class="history-title" style="color: #fff; font-weight: 700;">${log.blend || 'Kadak Cutting Chai'} ${log.sugar !== undefined ? `(${log.sugar}g sugar)` : ''}</div>
                            <div class="history-meta" style="color: var(--text-muted); font-size: 0.74rem;">${log.time} &bull; Temp: ${log.temp || 64}&deg;C &bull; Verified Fresh Cup</div>
                        </div>
                    </div>
                    <div class="history-right">
                        <span class="badge verified-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);">VERIFIED AUTHENTIC</span>
                    </div>
                `;
                listEl.appendChild(item);
            });
        }

        renderLeaderboard() {
            const container = document.getElementById('leaderboard-content');
            container.innerHTML = '';

            if (this.activeLeaderboardTab === 'students') {
                this.renderStudentsLeaderboard(container);
            } else if (this.activeLeaderboardTab === 'hostels') {
                this.renderHostelLeaderboard(container);
            } else if (this.activeLeaderboardTab === 'departments') {
                this.renderDeptLeaderboard(container);
            }
        }

        renderStudentsLeaderboard(container) {
            const tier = this.activeLeaderboardTier;
            const sorted = [...this.students].sort((a, b) => {
                if (tier === 'daily') return b.cupsToday - a.cupsToday;
                if (tier === 'weekly') return b.weeklyCups - a.weeklyCups;
                return b.allTimeCups - a.allTimeCups;
            });

            const table = document.createElement('div');
            table.className = 'lb-table';

            sorted.forEach((stu, idx) => {
                const rank = idx + 1;
                const isCurrent = this.currentStudent && stu.email === this.currentStudent.email;
                const cupCount = tier === 'daily' ? stu.cupsToday : (tier === 'weekly' ? stu.weeklyCups : stu.allTimeCups);

                const row = document.createElement('div');
                row.className = `lb-row ${isCurrent ? 'current-student-row' : ''}`;
                row.innerHTML = `
                    <div class="lb-rank" style="font-weight: 800; color: ${rank <= 3 ? 'var(--chai-amber)' : 'var(--text-muted)'};">#${rank}</div>
                    <div class="lb-avatar" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(245, 158, 11, 0.2); color: var(--chai-cream); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; border: 1px solid var(--chai-amber);">${stu.avatar || 'OP'}</div>
                    <div class="lb-details">
                        <div class="lb-name" style="color: #fff; font-weight: 700;">${stu.name} ${isCurrent ? '<span class="you-pill">YOU</span>' : ''}</div>
                        <div class="lb-sub" style="font-size: 0.72rem; color: var(--text-muted);">${stu.studentClass || stu.dept || ''} &bull; Year ${stu.year || ''}</div>
                    </div>
                    <div class="lb-score" style="text-align: right;">
                        <span class="score-num" style="font-size: 1.2rem; font-weight: 800; color: var(--chai-amber);">${cupCount}</span>
                        <span class="score-label" style="font-size: 0.7rem; color: var(--text-muted); display: block;">units</span>
                    </div>
                `;
                table.appendChild(row);
            });

            container.appendChild(table);
        }

        renderHostelLeaderboard(container) {
            // Group by class
            const classMap = {};
            this.students.forEach(s => {
                const cls = s.studentClass || s.dept || 'Unknown';
                if (!classMap[cls]) {
                    classMap[cls] = { name: cls, totalCupsToday: 0, totalWeekly: 0, studentCount: 0 };
                }
                classMap[cls].totalCupsToday += s.cupsToday;
                classMap[cls].totalWeekly    += s.weeklyCups;
                classMap[cls].studentCount++;
            });

            const hostels = Object.values(classMap).sort((a, b) => b.totalCupsToday - a.totalCupsToday);

            const grid = document.createElement('div');
            grid.className = 'rivalry-grid';

            hostels.forEach((h, idx) => {
                const rank = idx + 1;
                const card = document.createElement('div');
                card.className = 'rivalry-card';
                card.innerHTML = `
                    <div class="rivalry-rank" style="color: var(--chai-amber); font-weight: 800; font-size: 0.78rem;">#${rank} STANDING</div>
                    <h3 class="rivalry-title" style="color: #fff; font-weight: 700; margin: 0.2rem 0 0.6rem 0;">${h.name}</h3>
                    <div class="rivalry-stats">
                        <div class="r-stat">
                            <span class="r-stat-num" style="color: var(--chai-cream); font-weight: 800;">${h.totalCupsToday}</span>
                            <span class="r-stat-lbl">Today</span>
                        </div>
                        <div class="r-stat">
                            <span class="r-stat-num" style="color: var(--text-secondary);">${(h.totalCupsToday / Math.max(1, h.studentCount)).toFixed(1)}</span>
                            <span class="r-stat-lbl">Avg/Operator</span>
                        </div>
                        <div class="r-stat">
                            <span class="r-stat-num" style="color: var(--chai-amber);">${h.totalWeekly}</span>
                            <span class="r-stat-lbl">Weekly</span>
                        </div>
                    </div>
                    <div class="rivalry-bar-wrapper" style="margin-top: 0.8rem; height: 6px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); overflow: hidden;">
                        <div class="rivalry-progress" style="width: ${Math.min(100, h.totalCupsToday * 10)}%; height: 100%; background: linear-gradient(90deg, var(--chai-deep), var(--chai-amber));"></div>
                    </div>
                `;
                grid.appendChild(card);
            });

            container.appendChild(grid);
        }

        renderDeptLeaderboard(container) {
            // Group by class for new email-based students OR by dept for legacy
            const deptMap = {};
            this.students.forEach(s => {
                const d = s.studentClass || s.dept || 'Unknown';
                if (!deptMap[d]) {
                    deptMap[d] = { name: d, totalCupsToday: 0, studentCount: 0 };
                }
                deptMap[d].totalCupsToday += s.cupsToday;
                deptMap[d].studentCount++;
            });

            const depts = Object.values(deptMap).sort((a, b) => b.totalCupsToday - a.totalCupsToday);

            const wrapper = document.createElement('div');
            wrapper.className = 'dept-rivalry-container';

            const maxCups = Math.max(...depts.map(d => d.totalCupsToday), 1);

            depts.forEach((d, idx) => {
                const pct = (d.totalCupsToday / maxCups) * 100;
                const item = document.createElement('div');
                item.className = 'dept-rivalry-item';
                item.innerHTML = `
                    <div class="dept-info" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                        <span class="dept-name" style="color: #fff; font-weight: 700;">#${idx + 1} ${d.name}</span>
                        <span class="dept-count" style="color: var(--chai-amber); font-weight: 800;">${d.totalCupsToday} units today</span>
                    </div>
                    <div class="dept-meter" style="height: 6px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); overflow: hidden;">
                        <div class="dept-fill" style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--chai-deep), var(--chai-amber));"></div>
                    </div>
                `;
                wrapper.appendChild(item);
            });

            container.appendChild(wrapper);
        }

        // Camera Authentication Flow
        async openCameraFlow() {
            if (!this.currentStudent) {
                this.showToast('Please sign in first to access the Chai Scanner.');
                this.scrollToAuth('login');
                return;
            }

            if (!this.cameraModal) {
                this.cameraModal = document.getElementById('camera-modal');
            }
            if (this.cameraModal) {
                this.cameraModal.classList.remove('hidden');
                this.cameraModal.style.display = 'flex';
                this.cameraModal.style.zIndex = '10000';
            }

            if (this.verificationResults) this.verificationResults.innerHTML = '';
            if (this.aiScannerStatus) this.aiScannerStatus.textContent = 'Initializing Camera...';
            if (this.btnSnapChai) this.btnSnapChai.disabled = false;
            this.uploadedImageBase64 = null;

            if (this.cameraAuth) {
                const started = await this.cameraAuth.startCamera(this.videoFeed);
                if (started) {
                    if (this.videoFeed) this.videoFeed.classList.remove('hidden');
                    if (this.capturePreview) this.capturePreview.classList.add('hidden');
                    if (this.aiScannerStatus) this.aiScannerStatus.textContent = 'Camera active. Position cutting chai glass inside reticle and click verify.';
                } else {
                    if (this.videoFeed) this.videoFeed.classList.add('hidden');
                    if (this.capturePreview) {
                        this.capturePreview.classList.remove('hidden');
                        const ctx = this.capturePreview.getContext('2d');
                        this.cameraAuth.drawSimulatedChaiPhoto(ctx, true, 0);
                    }
                    if (this.aiScannerStatus) this.aiScannerStatus.textContent = 'Simulation viewfinder active. Click verify to test scan.';
                }
            }
        }

        closeCameraFlow() {
            if (this.cameraAuth) this.cameraAuth.stopCamera();
            if (this.cameraModal) {
                this.cameraModal.classList.add('hidden');
                this.cameraModal.style.display = 'none';
            }
        }

        runVerificationFlow(mode = 'normal') {
            if (this.btnSnapChai) this.btnSnapChai.disabled = true;
            if (this.aiScannerStatus) this.aiScannerStatus.textContent = 'Checking your chai glass with AI...';
            if (window.chaiAudio && typeof window.chaiAudio.playPour === 'function') {
                window.chaiAudio.playPour();
            }

            const frameCanvas = this.cameraAuth ? this.cameraAuth.captureFrame(this.videoFeed) : document.createElement('canvas');
            if (mode === 'non_tea' && this.cameraAuth) {
                const ctx = frameCanvas.getContext('2d');
                this.cameraAuth.drawSimulatedChaiPhoto(ctx, false);
            }

            const historyHashes = (this.currentStudent && this.currentStudent.logs ? this.currentStudent.logs : []).map(l => l.pHashBinary || '');

            setTimeout(() => {
                if (this.cameraAuth) {
                    const result = this.cameraAuth.verifyChaiCapture(frameCanvas, historyHashes, mode);
                    this.displayVerificationResult(result);
                }
                if (this.btnSnapChai) this.btnSnapChai.disabled = false;
            }, 600);
        }

        displayVerificationResult(res) {
            const container = this.verificationResults;
            container.innerHTML = '';

            const card = document.createElement('div');
            card.className = `verification-card ${res.passed ? 'verify-success' : 'verify-failed'}`;

            if (res.passed) {
                if (window.chaiAudio && typeof window.chaiAudio.playScanSuccess === 'function') {
                    window.chaiAudio.playScanSuccess();
                }
                card.innerHTML = `
                    <div class="verify-header" style="color: #34d399; font-weight: 800; font-size: 1.05rem; margin-bottom: 0.5rem;">
                        Real Cutting Chai Verified!
                    </div>
                    <p style="font-size: 0.85rem; color: #a7f3d0; margin-bottom: 0.8rem;">Looks like a genuine glass of hot chai. Enjoy your drink!</p>
                    <div class="verify-specs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem; background: rgba(0,0,0,0.35); padding: 0.75rem; border-radius: 10px;">
                        <div><strong>Cup:</strong> Glass Tumbler</div>
                        <div><strong>Tea:</strong> Kadak Milk Chai</div>
                        <div><strong>Temperature:</strong> ~${res.estimatedTemp || 65}&deg;C (Hot)</div>
                        <div><strong>Status:</strong> Fresh new photo</div>
                    </div>
                    <button id="btn-confirm-log" class="btn btn-primary full-width" style="margin-top: 1rem;">
                        RECORD THIS CHAI (+150 AURA)
                    </button>
                `;
                container.appendChild(card);

                document.getElementById('btn-confirm-log').addEventListener('click', () => {
                    this.commitChaiLog(res);
                });
            } else {
                if (window.chaiAudio && typeof window.chaiAudio.playWarning === 'function') {
                    window.chaiAudio.playWarning();
                }
                card.innerHTML = `
                    <div class="verify-header" style="color: #f87171; font-weight: 800; font-size: 1.05rem; margin-bottom: 0.5rem;">
                        Not Recognized as Chai
                    </div>
                    <p style="font-size: 0.84rem; color: #fca5a5; font-weight: 600; margin-bottom: 0.6rem;">${res.reason}</p>
                    <div class="fraud-notice" style="margin-top: 0.6rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 8px;">
                        Tip: Hold up a clear glass of authentic cutting chai to the camera or upload a clear photo of your chai glass. Empty glasses, desks, or repeated photos won't count!
                    </div>
                `;
                container.appendChild(card);
            }
        }

        commitChaiLog(res) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const blendSelect = document.getElementById('chai-blend-select');
            const sugarSelect = document.getElementById('chai-sugar-select');

            let addedCalories = BASELINE.calories;
            let addedSugar = BASELINE.sugar;
            let blendName = 'Standard Cutting Tea (100ml)';

            if (blendSelect) {
                const bVal = blendSelect.value;
                if (bVal === 'masala') { addedCalories += 5; blendName = 'Spiced Masala Infusion (+5 kcal)'; }
                else if (bVal === 'adrak') { addedCalories += 3; blendName = 'Ginger Extract Blend (+3 kcal)'; }
                else if (bVal === 'elaichi') { addedCalories += 5; blendName = 'Cardamom Infusion (+5 kcal)'; }
            }

            if (sugarSelect) {
                const sVal = sugarSelect.value;
                if (sVal === 'sugarfree') { addedSugar = 0; addedCalories -= 30; }
                else if (sVal === 'light') { addedSugar = 3.5; addedCalories -= 15; }
                else if (sVal === 'extra') { addedSugar = 12.0; addedCalories += 18; }
            }

            this.currentStudent.cupsToday += 1;
            this.currentStudent.weeklyCups += 1;
            this.currentStudent.allTimeCups += 1;

            if (!this.currentStudent.logs) this.currentStudent.logs = [];
            this.currentStudent.logs.push({
                time: timeStr,
                temp: res.estimatedTemp || 65,
                hash: res.pHash,
                pHashBinary: res.pHashBinary,
                blend: blendName,
                sugar: addedSugar,
                calories: Math.max(15, addedCalories),
                caffeine: BASELINE.caffeine
            });

            this.saveStudents(this.students);
            this.closeCameraFlow();

            this.renderStudentProfile();
            this.renderMetrics();
            this.renderHistory();
            this.renderLeaderboard();

            if (this.hero3D) {
                this.hero3D.setCupCount(this.currentStudent.cupsToday);
            }

            if (window.chaiAudio && typeof window.chaiAudio.playPour === 'function') {
                window.chaiAudio.playPour();
                setTimeout(() => window.chaiAudio.playClink(), 300);
            }

            this.showToast(`Chai #${this.currentStudent.cupsToday} locked in! +150 Aura points gained // No cap.`);
        }

        openPassModal() {
            if (!this.currentStudent) return;
            document.getElementById('pass-name').textContent = this.currentStudent.name;
            document.getElementById('pass-roll').textContent = this.currentStudent.email || (this.currentStudent.studentClass + ' · Year ' + this.currentStudent.year);
            document.getElementById('pass-hostel-dept').textContent = `${this.currentStudent.studentClass || ''} · Year ${this.currentStudent.year || ''}`;
            document.getElementById('pass-cups-today').textContent = `${this.currentStudent.cupsToday} Cups`;
            document.getElementById('pass-streak').textContent = `${this.currentStudent.streak || 1} Days`;
            document.getElementById('pass-all-time').textContent = `${this.currentStudent.allTimeCups} Cups`;

            const latestLog = this.currentStudent.logs && this.currentStudent.logs.length > 0 ? this.currentStudent.logs[this.currentStudent.logs.length - 1] : null;
            document.getElementById('pass-fingerprint').textContent = `AUTH_ID: ${latestLog ? latestLog.hash : '0xFA391823B1E40812'}`;

            this.chaiPassModal.classList.remove('hidden');
        }

        closePassModal() {
            this.chaiPassModal.classList.add('hidden');
        }

        showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast-alert';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 20);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.chaiboardApp = new ChaiboardApp();
    });
})();
