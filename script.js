// Function to validate the registration form
function validateRegistrationForm(event) {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (username === '') {
        alert('❌ Username is required.');
        event.preventDefault();
        return false;
    }

    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters long.');
        event.preventDefault();
        return false;
    }

    if (password !== confirmPassword) {
        alert('❌ Passwords do not match.');
        event.preventDefault();
        return false;
    }

    return true;
}

// Function to validate the login form
function validateLoginForm(event) {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (username === '') {
        alert('❌ Username is required.');
        event.preventDefault();
        return false;
    }

    if (password === '') {
        alert('❌ Password is required.');
        event.preventDefault();
        return false;
    }

    return true;
}

// Attach event listeners to forms
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form[action="/register"]');
    const loginForm = document.querySelector('form[action="/login"]');

    if (registerForm) {
        registerForm.addEventListener('submit', validateRegistrationForm);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', validateLoginForm);
    }
});