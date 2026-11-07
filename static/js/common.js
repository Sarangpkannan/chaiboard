// Chaiboard Common Multi-Window Client SDK with BroadcastChannel Real-Time Sync
(function() {
    const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('chaiboard_cross_window_sync') : null;

    window.Chaiboard = {
        syncChannel: syncChannel,

        notifyWindows(eventType, payload = {}) {
            if (this.syncChannel) {
                this.syncChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
            }
        },

        async getCurrentStudent() {
            try {
                const res = await fetch('/api/me');
                if (res.status === 401) {
                    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                        window.location.href = '/login';
                    }
                    return null;
                }
                const data = await res.json();
                return data.student;
            } catch (err) {
                console.error('Error fetching student session:', err);
                return null;
            }
        },

        async logout() {
            try {
                await fetch('/api/logout', { method: 'POST' });
            } finally {
                window.location.href = '/login';
            }
        },

        openSeparateWindow(url, title = 'ChaiboardWindow') {
            const width = 1100;
            const height = 820;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            window.open(url, title, `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`);
        },

        showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = `toast-alert ${isError ? 'toast-error' : ''}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 20);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        },

        initDock() {
            const logoutBtn = document.getElementById('dock-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }

            // Sound Toggle
            const soundBtn = document.getElementById('dock-sound-btn');
            if (soundBtn && window.chaiAudio) {
                soundBtn.addEventListener('click', () => {
                    window.chaiAudio.soundEnabled = !window.chaiAudio.soundEnabled;
                    soundBtn.textContent = window.chaiAudio.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
                });
            }

            // Pop window buttons
            document.querySelectorAll('.window-pop-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetUrl = btn.getAttribute('data-url');
                    this.openSeparateWindow(targetUrl, btn.getAttribute('data-title'));
                });
            });

            // Listen for cross-window sync broadcasts
            if (this.syncChannel) {
                this.syncChannel.onmessage = (event) => {
                    const { type } = event.data;
                    console.log('[Chaiboard Sync] Received event from another window:', type);

                    if (type === 'CHAI_LOGGED') {
                        if (typeof window.loadHealthMetrics === 'function') window.loadHealthMetrics();
                        if (typeof window.loadLeaderboard === 'function') window.loadLeaderboard();
                        if (typeof window.loadProfileData === 'function') window.loadProfileData();
                        if (typeof window.loadAdminData === 'function') window.loadAdminData();
                        if (typeof window.refreshMetrics === 'function') window.refreshMetrics();
                    } else if (type === 'SETTINGS_UPDATED') {
                        if (typeof window.loadHealthMetrics === 'function') window.loadHealthMetrics();
                        if (typeof window.loadAdminData === 'function') window.loadAdminData();
                    }
                };
            }

            // Fetch session and update header
            this.getCurrentStudent().then(student => {
                if (student) {
                    const nameEl = document.getElementById('dock-student-name');
                    const subEl = document.getElementById('dock-student-sub');
                    const avatarEl = document.getElementById('dock-student-avatar');
                    if (nameEl) nameEl.textContent = student.name;
                    if (subEl) subEl.textContent = student.department;
                    if (avatarEl) avatarEl.textContent = student.avatar || '☕';

                    // Show Admin Link in dock if admin
                    const navList = document.querySelector('.nav-windows-list');
                    if (student.role === 'admin' && navList && !document.getElementById('dock-admin-link')) {
                        const adminLink = document.createElement('a');
                        adminLink.id = 'dock-admin-link';
                        adminLink.href = '/admin';
                        adminLink.className = `window-nav-link ${window.location.pathname === '/admin' ? 'active' : ''}`;
                        adminLink.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        adminLink.innerHTML = `
                            <span>👑 Admin Portal</span>
                            <button class="window-pop-btn" data-url="/admin" data-title="ChaiAdmin" title="Open in separate window">↗</button>
                        `;
                        navList.appendChild(adminLink);

                        adminLink.querySelector('.window-pop-btn').addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.openSeparateWindow('/admin', 'ChaiAdmin');
                        });
                    }
                }
            });
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.Chaiboard.initDock();
    });
})();
