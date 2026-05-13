// register.js - user registration logic based on Table 3 (users) and Section 1.5
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const alertBox = document.getElementById('alert');

    window.togglePassword = function(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.type = field.type === 'password' ? 'text' : 'password';
        }
    };

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const fullName = document.getElementById('full_name').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const role = document.getElementById('role').value;
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm_password').value;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        alertBox.classList.remove('show');
        alertBox.className = 'alert';

        let isValid = true;

        if (!fullName) {
            document.getElementById('fullNameError').textContent = 'Full name required';
            isValid = false;
        }
        if (!email || !email.includes('@')) {
            document.getElementById('emailError').textContent = 'Valid email required';
            isValid = false;
        }
        if (!username) {
            document.getElementById('usernameError').textContent = 'Username required';
            isValid = false;
        }
        if (password !== confirm) {
            document.getElementById('confirmError').textContent = 'Passwords do not match';
            isValid = false;
        }
        if (password.length < 6) {
            document.getElementById('confirmError').textContent = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (!isValid) return;

        // Get existing users
        let users = JSON.parse(localStorage.getItem('cemetery_users') || '[]');

        // Check for duplicate username
        if (users.some(u => u.username === username)) {
            alertBox.textContent = 'Username already exists. Please choose another.';
            alertBox.classList.add('show', 'alert-danger');
            return;
        }

        // Create new user object (matches Table 3 fields)
        const newUser = {
            user_id: users.length + 1,
            username: username,
            password: password, // In real backend, hash with bcrypt
            role: role,
            full_name: fullName,
            email: email,
            is_active: true,
            created_at: new Date().toISOString(),
            last_login: null
        };
        users.push(newUser);
        localStorage.setItem('cemetery_users', JSON.stringify(users));

        // Show success and redirect to login
        alertBox.textContent = 'Registration successful! Redirecting to login...';
        alertBox.classList.add('show', 'alert-success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
});