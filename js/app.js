// Chaiboard - Main Campus Tea Engine & Student Management
(function() {
    // Initial Student Dataset
    const DEFAULT_STUDENTS = [
        {
            rollNo: 'CS23B104',
            name: 'Aarav Sharma',
            pin: '1234',
            hostel: 'Hostel Everest (Block A)',
            dept: 'Computer Science',
            avatar: '☕👨‍💻',
            cupsToday: 4,
            weeklyCups: 26,
            allTimeCups: 342,
            streak: 18,
            title: 'Night Shift Code Brewer',
            logs: [
                { time: '08:45 AM', temp: 66, hash: '0xFA391823B1E40812' },
                { time: '11:30 AM', temp: 64, hash: '0xA71295D314C05671' },
                { time: '02:15 PM', temp: 68, hash: '0xB89422F5128032AA' },
                { time: '05:40 PM', temp: 63, hash: '0x99238FF01A2548BC' }
            ]
        },
        {
            rollNo: 'ME22B019',
            name: 'Priya Patel',
            pin: '1234',
            hostel: 'Hostel Nilgiri (Block B)',
            dept: 'Mechanical Engineering',
            avatar: '⚡👩‍🔧',
            cupsToday: 5,
            weeklyCups: 29,
            allTimeCups: 410,
            streak: 24,
            title: 'Workshop Steam Engine',
            logs: [
                { time: '09:10 AM', temp: 67, hash: '0x342918820B1D4011' },
                { time: '12:05 PM', temp: 65, hash: '0x431294C314C05999' },
                { time: '03:30 PM', temp: 69, hash: '0x589422A512803111' },
                { time: '06:15 PM', temp: 62, hash: '0x79238AA01A254222' },
                { time: '08:00 PM', temp: 64, hash: '0x88238EE01A254333' }
            ]
        },
        {
            rollNo: 'EC24B088',
            name: 'Rohan Verma',
            pin: '1234',
            hostel: 'Hostel Aravali (Block C)',
            dept: 'Electronics & Comm',
            avatar: '📻👨‍🎓',
            cupsToday: 3,
            weeklyCups: 19,
            allTimeCups: 185,
            streak: 9,
            title: 'Silicon Chai Sipper',
            logs: [
                { time: '10:00 AM', temp: 65, hash: '0x1A2B3C4D5E6F7081' },
                { time: '01:45 PM', temp: 63, hash: '0x2B3C4D5E6F708192' },
                { time: '05:10 PM', temp: 67, hash: '0x3C4D5E6F708192A3' }
            ]
        },
        {
            rollNo: 'BT23B045',
            name: 'Ananya Deshmukh',
            pin: '1234',
            hostel: 'Hostel Ganga (Girls Block)',
            dept: 'Biotechnology',
            avatar: '🧬👩‍🔬',
            cupsToday: 2,
            weeklyCups: 14,
            allTimeCups: 156,
            streak: 7,
            title: 'Cellular Caffeine Analyst',
            logs: [
                { time: '11:15 AM', temp: 64, hash: '0x4D5E6F708192A3B4' },
                { time: '04:20 PM', temp: 68, hash: '0x5E6F708192A3B4C5' }
            ]
        },
        {
            rollNo: 'CE22B012',
            name: 'Vikram Singh',
            pin: '1234',
            hostel: 'Hostel Everest (Block A)',
            dept: 'Civil Engineering',
            avatar: '🏗️👷‍♂️',
            cupsToday: 4,
            weeklyCups: 24,
            allTimeCups: 290,
            streak: 15,
            title: 'Concrete Chai Pillar',
            logs: [
                { time: '08:30 AM', temp: 65, hash: '0x6F708192A3B4C5D6' },
                { time: '12:40 PM', temp: 67, hash: '0x708192A3B4C5D6E7' },
                { time: '03:55 PM', temp: 63, hash: '0x8192A3B4C5D6E7F8' },
                { time: '07:20 PM', temp: 66, hash: '0x92A3B4C5D6E7F809' }
            ]
        }
    ];

    // Health Engine Baseline per cup (PRD Section 4)
    const BASELINE = {
        calories: 45, // kcal
        sugar: 7.5,   // grams
        caffeine: 30, // mg
        volume: 100   // ml
    };

    // Humorous Thresholds from PRD Section 4
    const THRESHOLDS = {
        calories: {
            limit: 250,
            quote: '“Running a marathon in your mind only” 🏃‍♂️💭'
        },
        sugar: {
            limit: 30,
            quote: '“Pancreas requests a temporary ceasefire” 🏳️🍬'
        },
        caffeine: {
            limit: 150,
            quote: '“Heart rate keeping tempo with a bass drum” 🥁⚡'
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
            this.init();
        }

        loadStudents() {
            const saved = localStorage.getItem('chaiboard_students_v2');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse saved students', e);
                }
            }
            this.saveStudents(DEFAULT_STUDENTS);
            return DEFAULT_STUDENTS;
        }

        saveStudents(data) {
            localStorage.setItem('chaiboard_students_v2', JSON.stringify(data));
        }

        init() {
            this.bindDOM();
            this.checkSession();
        }

        bindDOM() {
            // Auth / Login elements
            this.loginSection = document.getElementById('login-section');
            this.dashboardSection = document.getElementById('dashboard-section');
            this.loginForm = document.getElementById('login-form');
            this.registerForm = document.getElementById('register-form');
            this.demoButtons = document.querySelectorAll('.demo-login-btn');
            this.showRegisterBtn = document.getElementById('show-register-btn');
            this.showLoginBtn = document.getElementById('show-login-btn');
            this.logoutBtn = document.getElementById('logout-btn');

            // Quick student switch trigger
            this.switchStudentBtn = document.getElementById('switch-student-btn');

            // Sound Toggle
            this.toggleSoundBtn = document.getElementById('toggle-sound-btn');
            if (this.toggleSoundBtn) {
                this.toggleSoundBtn.addEventListener('click', () => {
                    if (window.chaiAudio) {
                        window.chaiAudio.soundEnabled = !window.chaiAudio.soundEnabled;
                        this.toggleSoundBtn.textContent = window.chaiAudio.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
                    }
                });
            }

            // Digital Chai Pass Modal
            this.chaiPassModal = document.getElementById('chai-pass-modal');
            this.btnChaiPass = document.getElementById('btn-chai-pass');
            this.btnClosePass = document.getElementById('btn-close-pass');
            this.btnPrintPass = document.getElementById('btn-print-pass');

            if (this.btnChaiPass) {
                this.btnChaiPass.addEventListener('click', () => this.showChaiPassModal());
            }
            if (this.btnClosePass) {
                this.btnClosePass.addEventListener('click', () => this.chaiPassModal.classList.add('hidden'));
            }
            if (this.btnPrintPass) {
                this.btnPrintPass.addEventListener('click', () => window.print());
            }

            // 3D Glass & Action Buttons
            this.heroContainer = 'chai-3d-container';
            this.sloshBtn = document.getElementById('btn-slosh');
            this.openCameraBtn = document.getElementById('btn-log-chai');

            // Camera Modal
            this.cameraModal = document.getElementById('camera-modal');
            this.closeCameraBtn = document.getElementById('btn-close-camera');
            this.videoFeed = document.getElementById('camera-feed');
            this.capturePreview = document.getElementById('capture-preview');
            this.btnSnapChai = document.getElementById('btn-snap-chai');
            this.btnTestDuplicate = document.getElementById('btn-test-duplicate');
            this.btnTestNonTea = document.getElementById('btn-test-nontea');
            this.aiScannerStatus = document.getElementById('ai-scanner-status');
            this.verificationResults = document.getElementById('verification-results');

            // Leaderboard Tabs
            this.lbTabs = document.querySelectorAll('.lb-tab');
            this.lbTierSelect = document.getElementById('lb-tier-select');

            // Attach Event Listeners
            if (this.loginForm) {
                this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
            if (this.registerForm) {
                this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            }
            if (this.showRegisterBtn) {
                this.showRegisterBtn.addEventListener('click', () => {
                    this.loginForm.classList.add('hidden');
                    this.registerForm.classList.remove('hidden');
                });
            }
            if (this.showLoginBtn) {
                this.showLoginBtn.addEventListener('click', () => {
                    this.registerForm.classList.add('hidden');
                    this.loginForm.classList.remove('hidden');
                });
            }

            this.demoButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const roll = btn.getAttribute('data-roll');
                    this.loginAs(roll);
                });
            });

            if (this.logoutBtn) {
                this.logoutBtn.addEventListener('click', () => this.handleLogout());
            }
            if (this.switchStudentBtn) {
                this.switchStudentBtn.addEventListener('click', () => this.handleLogout());
            }

            if (this.sloshBtn) {
                this.sloshBtn.addEventListener('click', () => {
                    if (this.hero3D) this.hero3D.triggerSlosh();
                });
            }

            if (this.openCameraBtn) {
                this.openCameraBtn.addEventListener('click', () => this.openCameraFlow());
            }

            if (this.closeCameraBtn) {
                this.closeCameraBtn.addEventListener('click', () => this.closeCameraFlow());
            }

            if (this.btnSnapChai) {
                this.btnSnapChai.addEventListener('click', () => this.runVerificationFlow('normal'));
            }

            if (this.btnTestDuplicate) {
                this.btnTestDuplicate.addEventListener('click', () => this.runVerificationFlow('duplicate'));
            }

            if (this.btnTestNonTea) {
                this.btnTestNonTea.addEventListener('click', () => this.runVerificationFlow('non_tea'));
            }

            this.lbTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.lbTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.activeLeaderboardTab = tab.getAttribute('data-target');
                    this.renderLeaderboard();
                });
            });

            if (this.lbTierSelect) {
                this.lbTierSelect.addEventListener('change', (e) => {
                    this.activeLeaderboardTier = e.target.value;
                    this.renderLeaderboard();
                });
            }
        }

        checkSession() {
            const activeRoll = localStorage.getItem('chaiboard_active_roll');
            if (activeRoll) {
                const found = this.students.find(s => s.rollNo.toUpperCase() === activeRoll.toUpperCase());
                if (found) {
                    this.loginAs(found.rollNo);
                    return;
                }
            }
            this.showLoginView();
        }

        showLoginView() {
            this.loginSection.classList.remove('hidden');
            this.dashboardSection.classList.add('hidden');
        }

        showDashboardView() {
            this.loginSection.classList.add('hidden');
            this.dashboardSection.classList.remove('hidden');

            // Render all dashboard sections
            this.renderStudentProfile();
            this.renderMetrics();
            this.renderHistory();
            this.renderLeaderboard();

            // Initialize or update 3D Hero
            if (!this.hero3D) {
                this.hero3D = new Chai3DHero('chai-3d-container');
            }
            this.hero3D.setCupCount(this.currentStudent.cupsToday);
        }

        handleLogin(e) {
            e.preventDefault();
            const roll = document.getElementById('login-roll').value.trim().toUpperCase();
            const pin = document.getElementById('login-pin').value.trim();

            const student = this.students.find(s => s.rollNo.toUpperCase() === roll);
            if (!student) {
                alert(`Roll number "${roll}" not found! Try one of the demo buttons or register below.`);
                return;
            }
            if (student.pin && student.pin !== pin) {
                alert('Invalid Student PIN / Password! (Default PIN is 1234)');
                return;
            }

            this.loginAs(student.rollNo);
        }

        handleRegister(e) {
            e.preventDefault();
            const roll = document.getElementById('reg-roll').value.trim().toUpperCase();
            const name = document.getElementById('reg-name').value.trim();
            const hostel = document.getElementById('reg-hostel').value;
            const dept = document.getElementById('reg-dept').value;
            const pin = document.getElementById('reg-pin').value.trim() || '1234';

            if (!roll || !name) {
                alert('Please enter Roll Number and Name');
                return;
            }

            if (this.students.some(s => s.rollNo.toUpperCase() === roll)) {
                alert('Roll Number already registered! Please sign in.');
                return;
            }

            const avatars = ['☕👨‍💻', '⚡👩‍🔧', '☕👨‍🎓', '🫖👩‍🎓', '🚀🧑‍💻', '☕👩‍🔬'];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

            const newStudent = {
                rollNo: roll,
                name: name,
                pin: pin,
                hostel: hostel,
                dept: dept,
                avatar: randomAvatar,
                cupsToday: 0,
                weeklyCups: 0,
                allTimeCups: 0,
                streak: 1,
                title: 'Fresh Campus Sipper',
                logs: []
            };

            this.students.push(newStudent);
            this.saveStudents(this.students);
            alert(`Welcome to Chaiboard, ${name}! Your student tea account has been created.`);
            this.loginAs(roll);
        }

        loginAs(rollNo) {
            const student = this.students.find(s => s.rollNo.toUpperCase() === rollNo.toUpperCase());
            if (!student) return;

            this.currentStudent = student;
            localStorage.setItem('chaiboard_active_roll', student.rollNo);
            this.showDashboardView();

            if (window.chaiAudio) window.chaiAudio.playScanSuccess();
        }

        handleLogout() {
            localStorage.removeItem('chaiboard_active_roll');
            this.currentStudent = null;
            this.showLoginView();
        }

        renderStudentProfile() {
            if (!this.currentStudent) return;
            const s = this.currentStudent;

            document.getElementById('header-student-name').textContent = s.name;
            document.getElementById('header-student-meta').textContent = `${s.rollNo} • ${s.dept}`;
            document.getElementById('header-avatar').textContent = s.avatar || '☕';

            document.getElementById('profile-name').textContent = s.name;
            document.getElementById('profile-roll').textContent = s.rollNo;
            document.getElementById('profile-hostel').textContent = s.hostel;
            document.getElementById('profile-dept').textContent = s.dept;
            document.getElementById('profile-streak').textContent = `${s.streak} Days 🔥`;
            document.getElementById('profile-title').textContent = s.title;

            document.getElementById('hero-cups-count').textContent = s.cupsToday;
            document.getElementById('hero-volume-count').textContent = `${s.cupsToday * BASELINE.volume} ml`;
        }

        showChaiPassModal() {
            if (!this.currentStudent) return;
            const s = this.currentStudent;

            document.getElementById('pass-name').textContent = s.name;
            document.getElementById('pass-roll').textContent = s.rollNo;
            document.getElementById('pass-hostel-dept').textContent = `${s.hostel} • ${s.dept}`;
            document.getElementById('pass-avatar').textContent = s.avatar || '☕';
            document.getElementById('pass-cups-today').textContent = `${s.cupsToday} Cups`;
            document.getElementById('pass-streak').textContent = `${s.streak} Days 🔥`;
            document.getElementById('pass-all-time').textContent = `${s.allTimeCups} Cups`;

            const latestLog = (s.logs && s.logs.length > 0) ? s.logs[s.logs.length - 1] : null;
            const hash = latestLog ? latestLog.hash : '0xFA391823B1E40812';
            document.getElementById('pass-fingerprint').textContent = `AUTH_HASH: ${hash}`;

            this.chaiPassModal.classList.remove('hidden');
        }

        renderMetrics() {
            if (!this.currentStudent) return;
            const cups = this.currentStudent.cupsToday;
            const logs = this.currentStudent.logs || [];

            // Sum up custom logged nutrition or baseline
            let cals = 0;
            let sugar = 0;
            let caffeine = 0;

            if (logs.length > 0) {
                logs.forEach(l => {
                    cals += (l.calories !== undefined ? l.calories : BASELINE.calories);
                    sugar += (l.sugar !== undefined ? l.sugar : BASELINE.sugar);
                    caffeine += (l.caffeine !== undefined ? l.caffeine : BASELINE.caffeine);
                });
            } else {
                cals = cups * BASELINE.calories;
                sugar = cups * BASELINE.sugar;
                caffeine = cups * BASELINE.caffeine;
            }

            document.getElementById('metric-calories').textContent = `${Math.round(cals)} kcal`;
            document.getElementById('metric-sugar').textContent = `${sugar.toFixed(1)} g`;
            document.getElementById('metric-caffeine').textContent = `${Math.round(caffeine)} mg`;

            // Progress bars
            const calBar = document.getElementById('bar-calories');
            const sugarBar = document.getElementById('bar-sugar');
            const caffBar = document.getElementById('bar-caffeine');

            const calPct = Math.min(100, (cals / THRESHOLDS.calories.limit) * 100);
            const sugarPct = Math.min(100, (sugar / THRESHOLDS.sugar.limit) * 100);
            const caffPct = Math.min(100, (caffeine / THRESHOLDS.caffeine.limit) * 100);

            calBar.style.width = `${calPct}%`;
            sugarBar.style.width = `${sugarPct}%`;
            caffBar.style.width = `${caffPct}%`;

            // Humorous Warnings based on PRD Section 4
            const warnCal = document.getElementById('warn-calories');
            const warnSugar = document.getElementById('warn-sugar');
            const warnCaff = document.getElementById('warn-caffeine');

            if (cals > THRESHOLDS.calories.limit) {
                warnCal.innerHTML = `<span class="badge warning-badge">⚠️ LIMIT EXCEEDED</span><div class="quote-text">${THRESHOLDS.calories.quote}</div>`;
                warnCal.classList.remove('hidden');
                calBar.classList.add('bar-danger');
            } else {
                warnCal.classList.add('hidden');
                calBar.classList.remove('bar-danger');
            }

            if (sugar > THRESHOLDS.sugar.limit) {
                warnSugar.innerHTML = `<span class="badge warning-badge">⚠️ PANCREAS ALERT</span><div class="quote-text">${THRESHOLDS.sugar.quote}</div>`;
                warnSugar.classList.remove('hidden');
                sugarBar.classList.add('bar-danger');
            } else {
                warnSugar.classList.add('hidden');
                sugarBar.classList.remove('bar-danger');
            }

            if (caffeine > THRESHOLDS.caffeine.limit) {
                warnCaff.innerHTML = `<span class="badge warning-badge">⚠️ OVERCLOCK ALERT</span><div class="quote-text">${THRESHOLDS.caffeine.quote}</div>`;
                warnCaff.classList.remove('hidden');
                caffBar.classList.add('bar-danger');
            } else {
                warnCaff.classList.add('hidden');
                caffBar.classList.remove('bar-danger');
            }

            // Tongue temperature evaluation
            const tempBadge = document.getElementById('tongue-temp-badge');
            const tempQuote = document.getElementById('tongue-temp-quote');
            if (cups === 0) {
                tempBadge.textContent = 'Room Temp (No Chai Yet)';
                tempBadge.className = 'status-pill gray';
                tempQuote.textContent = 'Tap "Log Chai" with AI camera to start.';
            } else {
                const latestLog = this.currentStudent.logs[this.currentStudent.logs.length - 1];
                const temp = latestLog ? latestLog.temp : 65;
                if (temp > 67) {
                    tempBadge.textContent = `${temp}°C • Sizzling Hot`;
                    tempBadge.className = 'status-pill red';
                    tempQuote.textContent = 'Tongue Danger: Blow on it or sip from saucer edge! ♨️';
                } else if (temp >= 55) {
                    tempBadge.textContent = `${temp}°C • Optimal Tapri Heat`;
                    tempBadge.className = 'status-pill green';
                    tempQuote.textContent = 'Peak cutting chai experience. Sips hit just right.';
                } else {
                    tempBadge.textContent = `${temp}°C • Warm Chai`;
                    tempBadge.className = 'status-pill orange';
                    tempQuote.textContent = 'Bhai dubara garam karva le tapri wale se!';
                }
            }
        }

        renderHistory() {
            if (!this.currentStudent) return;
            const listEl = document.getElementById('chai-history-list');
            listEl.innerHTML = '';

            const logs = this.currentStudent.logs || [];
            if (logs.length === 0) {
                listEl.innerHTML = '<div class="empty-state">No chai logged today yet. Visit the tapri and snap your first cutting!</div>';
                return;
            }

            // Render in reverse chronological order
            [...logs].reverse().forEach((log, idx) => {
                const cupNumber = logs.length - idx;
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-left">
                        <div class="cup-icon">🫖 #${cupNumber}</div>
                        <div>
                            <div class="history-title">${log.blend || 'Cutting Chai Verified'} ${log.sugar !== undefined ? `(${log.sugar}g sugar)` : ''}</div>
                            <div class="history-meta">${log.time} • Est. ${log.temp || 64}°C • pHash: <code>${log.hash.substring(0, 10)}...</code></div>
                        </div>
                    </div>
                    <div class="history-right">
                        <span class="badge verified-badge">✓ AI Validated</span>
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
            // Sort students based on chosen tier
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
                const isCurrent = this.currentStudent && stu.rollNo === this.currentStudent.rollNo;
                let rankBadge = rank;
                if (rank === 1) rankBadge = '🥇';
                else if (rank === 2) rankBadge = '🥈';
                else if (rank === 3) rankBadge = '🥉';

                const cupCount = tier === 'daily' ? stu.cupsToday : (tier === 'weekly' ? stu.weeklyCups : stu.allTimeCups);

                const row = document.createElement('div');
                row.className = `lb-row ${isCurrent ? 'current-student-row' : ''}`;
                row.innerHTML = `
                    <div class="lb-rank">${rankBadge}</div>
                    <div class="lb-avatar">${stu.avatar || '☕'}</div>
                    <div class="lb-details">
                        <div class="lb-name">${stu.name} ${isCurrent ? '<span class="you-pill">YOU</span>' : ''}</div>
                        <div class="lb-sub">${stu.rollNo} • ${stu.hostel.split('(')[0].trim()} • ${stu.dept}</div>
                    </div>
                    <div class="lb-score">
                        <span class="score-num">${cupCount}</span>
                        <span class="score-label">cups</span>
                    </div>
                `;
                table.appendChild(row);
            });

            container.appendChild(table);
        }

        renderHostelLeaderboard(container) {
            // Aggregate by Hostel
            const hostelMap = {};
            this.students.forEach(s => {
                const h = s.hostel;
                if (!hostelMap[h]) {
                    hostelMap[h] = { name: h, totalCupsToday: 0, totalWeekly: 0, studentCount: 0 };
                }
                hostelMap[h].totalCupsToday += s.cupsToday;
                hostelMap[h].totalWeekly += s.weeklyCups;
                hostelMap[h].studentCount++;
            });

            const hostels = Object.values(hostelMap).sort((a, b) => b.totalCupsToday - a.totalCupsToday);

            const grid = document.createElement('div');
            grid.className = 'rivalry-grid';

            hostels.forEach((h, idx) => {
                const rank = idx + 1;
                const card = document.createElement('div');
                card.className = 'rivalry-card';
                card.innerHTML = `
                    <div class="rivalry-rank">${rank === 1 ? '🏆 Campus Chai Champions' : `#${rank} Contender`}</div>
                    <h3 class="rivalry-title">${h.name}</h3>
                    <div class="rivalry-stats">
                        <div class="r-stat">
                            <span class="r-stat-num">${h.totalCupsToday}</span>
                            <span class="r-stat-lbl">Cups Today</span>
                        </div>
                        <div class="r-stat">
                            <span class="r-stat-num">${(h.totalCupsToday / Math.max(1, h.studentCount)).toFixed(1)}</span>
                            <span class="r-stat-lbl">Avg / Student</span>
                        </div>
                        <div class="r-stat">
                            <span class="r-stat-num">${h.totalWeekly}</span>
                            <span class="r-stat-lbl">Weekly Total</span>
                        </div>
                    </div>
                    <div class="rivalry-bar-wrapper">
                        <div class="rivalry-progress" style="width: ${Math.min(100, h.totalCupsToday * 10)}%"></div>
                    </div>
                `;
                grid.appendChild(card);
            });

            container.appendChild(grid);
        }

        renderDeptLeaderboard(container) {
            // Aggregate by Department
            const deptMap = {};
            this.students.forEach(s => {
                const d = s.dept;
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
                    <div class="dept-info">
                        <span class="dept-rank">#${idx + 1}</span>
                        <span class="dept-name">${d.name}</span>
                        <span class="dept-count"><strong>${d.totalCupsToday}</strong> cups today</span>
                    </div>
                    <div class="dept-meter">
                        <div class="dept-fill" style="width: ${pct}%"></div>
                    </div>
                `;
                wrapper.appendChild(item);
            });

            container.appendChild(wrapper);
        }

        // Camera Verification Flow
        async openCameraFlow() {
            this.cameraModal.classList.remove('hidden');
            this.verificationResults.innerHTML = '';
            this.aiScannerStatus.textContent = 'Initializing Camera & MobileNet classifier...';
            this.btnSnapChai.disabled = false;

            const started = await this.cameraAuth.startCamera(this.videoFeed);
            if (started) {
                this.videoFeed.classList.remove('hidden');
                this.capturePreview.classList.add('hidden');
                this.aiScannerStatus.textContent = 'Live camera stream active. Position cutting chai glass inside reticle.';
            } else {
                // Fallback to simulated live camera viewfinder
                this.videoFeed.classList.add('hidden');
                this.capturePreview.classList.remove('hidden');
                const ctx = this.capturePreview.getContext('2d');
                this.cameraAuth.drawSimulatedChaiPhoto(ctx, true, 0);
                this.aiScannerStatus.textContent = 'Simulated Tapri Camera active (Camera permission not granted or no webcam).';
            }
        }

        closeCameraFlow() {
            this.cameraAuth.stopCamera();
            this.cameraModal.classList.add('hidden');
        }

        runVerificationFlow(mode = 'normal') {
            this.btnSnapChai.disabled = true;
            this.aiScannerStatus.textContent = 'Running MobileNet Object Detection & Computing 64-bit pHash...';
            if (window.chaiAudio) window.chaiAudio.playPour();

            // Capture frame from video or fallback canvas
            const frameCanvas = this.cameraAuth.captureFrame(this.videoFeed);

            // If non_tea mode, draw notebook
            if (mode === 'non_tea') {
                const ctx = frameCanvas.getContext('2d');
                this.cameraAuth.drawSimulatedChaiPhoto(ctx, false);
            }

            // User upload hashes from history
            const historyHashes = (this.currentStudent.logs || []).map(l => l.pHashBinary || '');

            setTimeout(() => {
                const result = this.cameraAuth.verifyChaiCapture(frameCanvas, historyHashes, mode);
                this.displayVerificationResult(result);
                this.btnSnapChai.disabled = false;
            }, 800);
        }

        displayVerificationResult(res) {
            const container = this.verificationResults;
            container.innerHTML = '';

            const card = document.createElement('div');
            card.className = `verification-card ${res.passed ? 'verify-success' : 'verify-failed'}`;

            if (res.passed) {
                if (window.chaiAudio) window.chaiAudio.playScanSuccess();
                card.innerHTML = `
                    <div class="verify-header">
                        <span class="verify-icon">✅</span>
                        <div>
                            <h4>Chai Authenticated!</h4>
                            <p>${res.reason}</p>
                        </div>
                    </div>
                    <div class="verify-specs">
                        <div><strong>Object Model:</strong> MobileNet v2 (Tea Glass)</div>
                        <div><strong>Confidence:</strong> ${res.confidence}</div>
                        <div><strong>Amber Brown Liquid:</strong> ${res.brownLiquidConfidence}</div>
                        <div><strong>Tongue Temp:</strong> ~${res.estimatedTemp}°C</div>
                        <div><strong>pHash (64-bit):</strong> <code>${res.pHash}</code></div>
                        <div><strong>Hamming Distance:</strong> ${res.minHamming} (&ge; 5 threshold verified)</div>
                    </div>
                    <button id="btn-confirm-log" class="btn btn-primary full-width" style="margin-top: 1rem;">
                        ☕ Confirm & Add to Leaderboard
                    </button>
                `;
                container.appendChild(card);

                document.getElementById('btn-confirm-log').addEventListener('click', () => {
                    this.commitChaiLog(res);
                });
            } else {
                if (window.chaiAudio) window.chaiAudio.playWarning();
                card.innerHTML = `
                    <div class="verify-header">
                        <span class="verify-icon">🚫</span>
                        <div>
                            <h4>Verification Failed</h4>
                            <p>${res.reason}</p>
                        </div>
                    </div>
                    <div class="verify-specs">
                        <div><strong>Failed Stage:</strong> ${res.stepFailed}</div>
                        <div><strong>Confidence / Distance:</strong> ${res.minHamming !== null ? `Hamming Dist = ${res.minHamming} (< 5 rejected)` : res.confidence}</div>
                        <div><strong>pHash Computed:</strong> <code>${res.pHash}</code></div>
                    </div>
                    <div class="fraud-notice">
                        🛡️ Anti-Cheat Policy: Live camera verification required. Gallery re-uploads or duplicate tea snapshots within 12 hours are rejected.
                    </div>
                `;
                container.appendChild(card);
            }
        }

        commitChaiLog(res) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Get selected customizations
            const blendSelect = document.getElementById('chai-blend-select');
            const sugarSelect = document.getElementById('chai-sugar-select');

            let addedCalories = BASELINE.calories;
            let addedSugar = BASELINE.sugar;
            let blendName = 'Standard Cutting';

            if (blendSelect) {
                const bVal = blendSelect.value;
                if (bVal === 'masala') { addedCalories += 5; blendName = 'Kadak Masala Chai'; }
                else if (bVal === 'adrak') { addedCalories += 3; blendName = 'Adrak Strong Chai'; }
                else if (bVal === 'elaichi') { addedCalories += 5; blendName = 'Shahi Elaichi Chai'; }
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

            // Refresh UI
            this.renderStudentProfile();
            this.renderMetrics();
            this.renderHistory();
            this.renderLeaderboard();

            // Trigger 3D Hero reaction
            if (this.hero3D) {
                this.hero3D.setCupCount(this.currentStudent.cupsToday);
            }

            // Sound
            if (window.chaiAudio) {
                window.chaiAudio.playPour();
                setTimeout(() => window.chaiAudio.playClink(), 300);
            }

            // Toast
            this.showToast(`☕ Cup #${this.currentStudent.cupsToday} logged! Leaderboard updated.`);
        }

        showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast-alert';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('show');
            }, 20);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        }
    }

    // Launch application when DOM ready
    window.addEventListener('DOMContentLoaded', () => {
        window.chaiboardApp = new ChaiboardApp();
    });
})();

