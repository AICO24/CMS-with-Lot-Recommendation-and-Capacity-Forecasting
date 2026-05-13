// login.js - authentication logic based on revised Capstone Section 1.5 (User Authentication)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const alertBox = document.getElementById('alert');

    // Seed a demo admin user if none exist so the UI is usable out of the box
    (function seedDemoAdmin() {
        let users = JSON.parse(localStorage.getItem('cemetery_users') || '[]');
        if (!users || users.length === 0) {
            const demo = {
                user_id: 1,
                username: 'Admin@cemetery.com',
                password: 'admin123',
                role: 'admin',
                full_name: 'Admin User',
                email: 'admin@cemetery.com',
                is_active: true,
                created_at: new Date().toISOString(),
                last_login: null
            };
            users = [demo];
            localStorage.setItem('cemetery_users', JSON.stringify(users));
            console.log('[SEED] Demo admin user created: Admin@cemetery.com / admin123');
        }
    })();

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        alertBox.classList.remove('show');
        alertBox.textContent = '';

        let isValid = true;
        if (!username) {
            document.getElementById('usernameError').textContent = 'Username is required';
            isValid = false;
        }
        if (!password) {
            document.getElementById('passwordError').textContent = 'Password is required';
            isValid = false;
        }
        if (!isValid) return;

        // Get users from localStorage (simulated database)
        const users = JSON.parse(localStorage.getItem('cemetery_users') || '[]');
        
        // Find user matching username, password, role, and active status
        const foundUser = users.find(u => u.username === username && u.password === password && u.role === role && u.is_active === true);

        if (foundUser) {
            // Create session object (matches Table 3 and Section 1.5)
            // Assign demo API token and permissions (for local/demo use)
            const rolePerms = {
                admin: {
                    token: 'admin-demo-token',
                    permissions: ['users.manage','audit.view','ai.manage','reports.view','reports.financial','lots.manage','decedents.manage','schedules.manage','payments.manage','notifications.view','forecast.view','relocation.manage','cremation.manage','expiration.view']
                },
                staff: {
                    token: 'staff-demo-token',
                    permissions: ['lots.manage','decedents.manage','schedules.manage','payments.manage','notifications.view','forecast.view','expiration.view']
                }
            };

            const rp = rolePerms[foundUser.role] || rolePerms.staff;
            const session = {
                userId: foundUser.user_id,
                username: foundUser.username,
                role: foundUser.role,
                fullName: foundUser.full_name,
                loginTime: new Date().toISOString(),
                apiToken: rp.token,
                permissions: rp.permissions
            };
            localStorage.setItem('cemetery_session', JSON.stringify(session));
            
            // Audit log (simulated)
            console.log(`[AUDIT] User ${foundUser.username} (${foundUser.role}) logged in at ${new Date().toISOString()}`);
            
            // Redirect to role-specific dashboard
            if (foundUser.role === 'admin') {
                window.location.href = 'dashboard_admin.html';
            } else {
                window.location.href = 'dashboard_staff.html';
            }
        } else {
            alertBox.textContent = 'Invalid credentials, wrong role, or account is inactive.';
            alertBox.classList.add('show');
        }
    });
});