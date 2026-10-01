const STORAGE_KEY = "IT_HELP_DESK_SYSTEM";
const SESSION_KEY = "IT_HELP_DESK_SESSION";
const LOGIN_ATTEMPTS_KEY = "IT_HELP_DESK_LOGIN_ATTEMPTS";
const MAX_LOGIN_ATTEMPTS = 5;

let data = {
    users: [],
    tickets: []
};

let currentUser = null;
let loginAttempts = Number(
    localStorage.getItem(LOGIN_ATTEMPTS_KEY) || 0
);

/* =========================
   HELPERS
========================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateId(prefix) {
    return prefix +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 7).toUpperCase();
}

function formatDate(date) {
    return new Date(date).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function statusClass(status) {
    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveSession() {
    if (currentUser) {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(currentUser)
        );
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
}

function resetLoginAttempts() {
    loginAttempts = 0;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, "0");
}

function addLoginAttempt() {
    loginAttempts++;
    localStorage.setItem(
        LOGIN_ATTEMPTS_KEY,
        String(loginAttempts)
    );
}

function showMessage(message, type = "error") {
    const old = document.querySelector(".app-message");

    if (old) {
        old.remove();
    }

    const messageBox = document.createElement("div");

    messageBox.className =
        "app-message " + type;

    messageBox.textContent = message;

    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.remove();
    }, 3500);
}

/* =========================
   EYE ICON
========================= */

function eyeIcon(open) {

    if (open) {
        return `
        <svg viewBox="0 0 24 24"
             width="20"
             height="20"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">

            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path>
            <circle cx="12" cy="12" r="3"></circle>

        </svg>
        `;
    }

    return `
    <svg viewBox="0 0 24 24"
         width="20"
         height="20"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">

        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3.1 3.9"></path>
        <path d="M6.6 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8"></path>

    </svg>
    `;
}

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) return;

    if (input.type === "password") {

        input.type = "text";

        button.innerHTML =
            eyeIcon(true);

        button.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        input.type = "password";

        button.innerHTML =
            eyeIcon(false);

        button.setAttribute(
            "aria-label",
            "Show password"
        );
    }
}

/* =========================
   DATA
========================= */

function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (saved) {

        try {
            data = JSON.parse(saved);
        } catch (error) {

            data = {
                users: [],
                tickets: []
            };
        }
    }

    if (!Array.isArray(data.users)) {
        data.users = [];
    }

    if (!Array.isArray(data.tickets)) {
        data.tickets = [];
    }

    const adminExists =
        data.users.some(
            user =>
                user.email.toLowerCase() ===
                "admin@helpdesk.com"
        );

    if (!adminExists) {

        data.users.unshift({
            id: "U001",
            name: "System Administrator",
            email: "admin@helpdesk.com",
            password: "admin123",
            role: "Admin",
            status: "Active"
        });

        saveData();
    }

    const session =
        localStorage.getItem(SESSION_KEY);

    if (session) {

        try {

            const savedUser =
                JSON.parse(session);

            const user =
                data.users.find(
                    item =>
                        item.id === savedUser.id
                );

            if (
                user &&
                user.status !== "Inactive"
            ) {
                currentUser = user;
            } else {
                localStorage.removeItem(
                    SESSION_KEY
                );
            }

        } catch (error) {

            localStorage.removeItem(
                SESSION_KEY
            );
        }
    }
}

/* =========================
   AUTH DESIGN
========================= */

function authShell(content) {
    return `
        <div class="auth-page">

            <div class="auth-container">

                <div class="auth-logo">
                    <img src="logo.png" alt="IT Help Desk Logo">
                </div>

                <div class="auth-brand">
                </div>

                ${content}

            </div>

        </div>
    `;
}

function passwordField(
    id,
    label,
    placeholder
) {

    return `
    <div class="form-group">

        <label for="${id}">
            ${label}
        </label>

        <div class="password-wrapper">

            <input
                type="password"
                id="${id}"
                placeholder="${placeholder}"
                required
            >

            <button
                type="button"
                class="password-toggle"
                onclick="togglePassword('${id}', this)"
                aria-label="Show password">

                ${eyeIcon(false)}

            </button>

        </div>

    </div>
    `;
}

/* =========================
   LOGIN
========================= */

function showLogin(email = "") {

    currentUser = null;

    localStorage.removeItem(
        SESSION_KEY
    );

    const locked =
        loginAttempts >= MAX_LOGIN_ATTEMPTS;

    document.getElementById(
        "app"
    ).innerHTML = authShell(`

        <form
            class="auth-form"
            onsubmit="login(event)"
        >

            <h2>
                Welcome Back
            </h2>

            <p class="auth-subtitle">
                Login to access the IT Help Desk System
            </p>

            ${
                locked
                    ? `
                    <div class="alert error">
                        You reached the maximum
                        of 5 login attempts.
                        Use Forgot Password
                        to reset your password.
                    </div>
                    `
                    : ""
            }

            <div class="form-group">

                <label for="loginEmail">
                    Email Address
                </label>

                <input
                    type="email"
                    id="loginEmail"
                    placeholder="Enter your email"
                    value="${escapeHTML(email)}"
                    required
                    ${locked ? "disabled" : ""}
                >

            </div>

            ${passwordField(
                "loginPassword",
                "Password",
                "Enter your password"
            )}

            <div class="forgot-row">

                <button
                    type="button"
                    class="text-button"
                    onclick="showForgotPassword()">

                    Forgot Password?

                </button>

            </div>

            <button
                type="submit"
                class="primary-btn"
                ${locked ? "disabled" : ""}>

                Login

            </button>

            <div class="auth-switch">

                Don't have an account?

                <button
                    type="button"
                    onclick="showSignup()">

                    Sign Up

                </button>

            </div>

            <div class="admin-login-link">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="showAdminLogin()">

                    Admin Login

                </button>

            </div>

            <p class="attempt-info">

                Failed attempts:
                ${Math.min(
                    loginAttempts,
                    MAX_LOGIN_ATTEMPTS
                )}
                / ${MAX_LOGIN_ATTEMPTS}

            </p>

        </form>

    `);

    setTimeout(() => {

        document
            .getElementById("loginEmail")
            ?.focus();

    }, 50);
}

function login(event) {

    event.preventDefault();

    if (
        loginAttempts >=
        MAX_LOGIN_ATTEMPTS
    ) {

        showMessage(
            "Maximum of 5 login attempts reached. Use Forgot Password."
        );

        return;
    }

    const email =
        document
            .getElementById("loginEmail")
            ?.value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("loginPassword")
            ?.value;

    if (!isValidEmail(email)) {

        showMessage(
            "Please enter a valid email address."
        );

        return;
    }

    if (!password) {

        showMessage(
            "Please enter your password."
        );

        return;
    }

    const user =
        data.users.find(
            item =>
                item.email.toLowerCase() ===
                    email &&
                item.password ===
                    password
        );

    if (!user) {

        addLoginAttempt();

        const remaining =
            MAX_LOGIN_ATTEMPTS -
            loginAttempts;

        if (remaining <= 0) {

            showLogin(email);

            showMessage(
                "Login locked after 5 failed attempts. Use Forgot Password."
            );

        } else {

            showLogin(email);

            showMessage(
                "Invalid email or password. " +
                remaining +
                " attempt(s) remaining."
            );
        }

        return;
    }

    if (user.status === "Inactive") {

        showMessage(
            "This account is inactive."
        );

        return;
    }

    currentUser = user;

    resetLoginAttempts();

    saveSession();

    showDashboard();
}

/* =========================
   ADMIN LOGIN
========================= */

function showAdminLogin() {

    document.getElementById(
        "app"
    ).innerHTML = authShell(`

        <form
            class="auth-form"
            onsubmit="adminLogin(event)"
        >

            <h2>
                Admin Login
            </h2>

            <p class="auth-subtitle">
                Administrator access
            </p>

            <div class="form-group">

                <label for="adminEmail">
                    Admin Email
                </label>

                <input
                    type="email"
                    id="adminEmail"
                    placeholder="admin@helpdesk.com"
                    required
                >

            </div>

            ${passwordField(
                "adminPassword",
                "Admin Password",
                "Enter admin password"
            )}

            <button
                type="submit"
                class="primary-btn">

                Login as Admin

            </button>

            <div class="auth-switch">

                <button
                    type="button"
                    onclick="showLogin()">

                    Back to User Login

                </button>

            </div>

        </form>

    `);
}

function adminLogin(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("adminEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("adminPassword")
            .value;

    if (!isValidEmail(email)) {

        showMessage(
            "Please enter a valid email."
        );

        return;
    }

    const admin =
        data.users.find(
            user =>
                user.email.toLowerCase() ===
                    email &&
                user.password ===
                    password &&
                user.role === "Admin"
        );

    if (!admin) {

        showMessage(
            "Invalid admin email or password."
        );

        return;
    }

    currentUser = admin;

    resetLoginAttempts();

    saveSession();

    showDashboard();
}

/* =========================
   SIGN UP
========================= */

function showSignup() {

    document.getElementById(
        "app"
    ).innerHTML = authShell(`

        <form
            class="auth-form"
            onsubmit="handleSignup(event)"
        >

            <h2>
                Create Account
            </h2>

            <p class="auth-subtitle">
                Register for the IT Help Desk System
            </p>

            <div class="form-group">

                <label for="signupName">
                    Full Name
                </label>

                <input
                    type="text"
                    id="signupName"
                    placeholder="Enter your full name"
                    required
                >

            </div>

            <div class="form-group">

                <label for="signupEmail">
                    Email Address
                </label>

                <input
                    type="email"
                    id="signupEmail"
                    placeholder="Enter your email"
                    required
                >

            </div>

            ${passwordField(
                "signupPassword",
                "Password",
                "At least 6 characters"
            )}

            ${passwordField(
                "signupConfirmPassword",
                "Confirm Password",
                "Re-enter your password"
            )}

            <button
                type="submit"
                class="primary-btn">

                Create Account

            </button>

            <div class="auth-switch">

                Already have an account?

                <button
                    type="button"
                    onclick="showLogin()">

                    Login

                </button>

            </div>

        </form>

    `);
}

function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById("signupName")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim().toLowerCase();
    const password = document.getElementById("signupPassword")?.value;
    const confirmPassword = document.getElementById("signupConfirmPassword")?.value;

    // Required fields
    if (!name || !email || !password || !confirmPassword) {
        showMessage("Please complete all required fields.");
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.");
        return;
    }

    // Password validation
    if (password.length < 8) {
        showMessage("Password must be at least 8 characters.");
        return;
    }

    // Confirm password
    if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        return;
    }

    // Check existing account
    const existingUser = data.users.find(
        user => user.email.toLowerCase() === email
    );

    if (existingUser) {
        showMessage("An account with this email already exists.");
        return;
    }

    // Create new account
    const newUser = {
        id: generateId("U"),
        name: name,
        email: email,
        password: password,
        role: "User",
        status: "Active",
        createdAt: new Date().toISOString()
    };

    // Save account
    data.users.push(newUser);
    saveData();

    // SUCCESS PAGE
    document.getElementById("app").innerHTML = `
        <div class="auth-page">
            <div class="auth-container success-container">

                <div class="success-logo">
                    <img src="logo.png" alt="IT Help Desk Logo">
                </div>

                <div class="success-icon">
                    ✓
                </div>

                <h2>Account Created Successfully!</h2>

                <p class="auth-subtitle">
                    Your IT Help Desk account has been created successfully.
                </p>

                <div class="success-message">
                    <p>
                        Welcome, <strong>${escapeHTML(name)}</strong>!
                    </p>

                    <p>
                        Your account has been registered.
                        You can now login using your email and password.
                    </p>
                </div>

                <button
                    type="button"
                    class="primary-btn"
                    onclick="showLogin('${escapeHTML(email)}')">
                    Go to Login
                </button>

            </div>
        </div>
    `;
}

/* =========================
   FORGOT PASSWORD
========================= */

function showForgotPassword() {

    document.getElementById(
        "app"
    ).innerHTML = authShell(`

        <form
            class="auth-form"
            onsubmit="resetPassword(event)"
        >

            <h2>
                Forgot Password
            </h2>

            <p class="auth-subtitle">
                Reset your account password
            </p>

            <div class="form-group">

                <label for="forgotEmail">
                    Email Address
                </label>

                <input
                    type="email"
                    id="forgotEmail"
                    placeholder="Enter your registered email"
                    required
                >

            </div>

            ${passwordField(
                "newPassword",
                "New Password",
                "At least 8 characters"
            )}

            ${passwordField(
    "signupConfirmPassword",
    "Confirm Password",
    "Re-enter your password"
)}
            )}

            <button
                type="submit"
                class="primary-btn">

                Reset Password

            </button>

            <div class="auth-switch">

                Remember your password?

                <button
                    type="button"
                    onclick="showLogin()">

                    Back to Login

                </button>

            </div>

        </form>

    `);
}

function resetPassword(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("forgotEmail")
            .value
            .trim()
            .toLowerCase();

    const newPassword =
        document
            .getElementById("newPassword")
            .value;

    const confirmPassword =
        document
            .getElementById(
                "confirmNewPassword"
            )
            .value;

    if (!isValidEmail(email)) {

        showMessage(
            "Please enter a valid email."
        );

        return;
    }

    if (newPassword.length < 6) {

        showMessage(
            "Password must be at least 6 characters."
        );

        return;
    }

    if (newPassword !== confirmPassword) {

        showMessage(
            "Passwords do not match."
        );

        return;
    }

    const user =
        data.users.find(
            item =>
                item.email.toLowerCase() ===
                email
        );

    if (!user) {

        showMessage(
            "No account was found with that email."
        );

        return;
    }

    user.password = newPassword;

    saveData();

    resetLoginAttempts();

    showMessage(
        "Password reset successfully!",
        "success"
    );

    setTimeout(() => {

        showLogin(email);

    }, 1000);
}

/* =========================
   NAVIGATION
========================= */

function navigationHTML(active) {
    return `
        <aside class="sidebar">

            <div class="sidebar-brand">

                <img
                    src="logo.png"
                    class="sidebar-logo"
                >

            </div>

            <nav>

                <button
                    class="${active === "dashboard" ? "active" : ""}"
                    onclick="showDashboard()">
                    <span>🏠</span>
                    Dashboard
                </button>

                ${
                    currentUser.role === "User"
                        ? `
                        <button
                            class="${active === "submit" ? "active" : ""}"
                            onclick="showSubmitRequest()">
                            <span>📝</span>
                            Submit Request
                        </button>
                        `
                        : ""
                }

                <button
                    class="${active === "status" ? "active" : ""}"
                    onclick="showRequestStatus()">
                    <span>📋</span>
                    Request Status
                </button>

                ${
                    currentUser.role === "Admin"
                        ? `
                        <button
                            class="${active === "queue" ? "active" : ""}"
                            onclick="showQueueManagement()">
                            <span>⚙️</span>
                            Queue Management
                        </button>
                        `
                        : ""
                }

            </nav>

            <div class="sidebar-bottom">

                <button onclick="logout()">
                    <span>🚪</span>
                    Logout
                </button>

            </div>

        </aside>
    `;
}

function pageShell(
    active,
    title,
    subtitle,
    content
) {

    return `

    <div class="system-layout">

        ${navigationHTML(active)}

        <main class="main-content">

            <header class="topbar">

                <div>

                    <h1>
                        ${title}
                    </h1>

                    <p>
                        ${subtitle}
                    </p>

                </div>

                <div class="user-info">

                    <strong>
                        ${escapeHTML(
                            currentUser.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            currentUser.role
                        )}
                    </span>

                </div>

            </header>

            <section class="content-area">

                ${content}

            </section>

        </main>

    </div>

    `;
}

/* =========================
   DASHBOARD
========================= */

function showDashboard() {

    if (!currentUser) {

        showLogin();

        return;
    }

    const tickets =
        currentUser.role === "Admin"
            ? data.tickets
            : data.tickets.filter(
                ticket =>
                    ticket.userId ===
                    currentUser.id
            );

    const total = tickets.length;

    const pending =
        tickets.filter(
            t => t.status === "Pending"
        ).length;

    const inProgress =
        tickets.filter(
            t => t.status === "In Progress"
        ).length;

    const completed =
        tickets.filter(
            t => t.status === "Completed"
        ).length;

    const recent =
        [...tickets]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 5);

    const recentHTML =
        recent.length
            ? recent.map(ticket => `

                <div class="ticket-item">

                    <div>

                        <strong>
                            ${escapeHTML(
                                ticket.subject
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                ticket.ticketNumber
                            )}
                        </p>

                    </div>

                    <span class="status-badge ${statusClass(
                        ticket.status
                    )}">

                        ${escapeHTML(
                            ticket.status
                        )}

                    </span>

                </div>

            `).join("")
            : `
                <div class="empty-state">
                    No requests yet.
                </div>
            `;

    const adminPanel =
        currentUser.role === "Admin"
            ? `
            <div class="dashboard-card">

                <h3>
                    Admin Information
                </h3>

                <p>
                    Total registered users:
                    <strong>
                        ${data.users.length}
                    </strong>
                </p>

                <p>
                    Total support requests:
                    <strong>
                        ${data.tickets.length}
                    </strong>
                </p>

                <button
                    class="primary-btn"
                    onclick="showQueueManagement()">

                    Open Queue Management

                </button>

            </div>
            `
            : `
            <div class="dashboard-card">

                <h3>
                    Need IT Support?
                </h3>

                <p>
                    Submit a request and track
                    your support ticket here.
                </p>

                <button
                    class="primary-btn"
                    onclick="showSubmitRequest()">

                    Submit Request

                </button>

            </div>
            `;

    document.getElementById(
        "app"
    ).innerHTML = pageShell(
        "dashboard",
        "Dashboard",
        "Welcome to the IT Help Desk Management System.",
        `

        <div class="stats-grid">

            <div class="stat-card">

                <span>
                    Total Requests
                </span>

                <strong>
                    ${total}
                </strong>

            </div>

            <div class="stat-card">

                <span>
                    Pending
                </span>

                <strong>
                    ${pending}
                </strong>

            </div>

            <div class="stat-card">

                <span>
                    In Progress
                </span>

                <strong>
                    ${inProgress}
                </strong>

            </div>

            <div class="stat-card">

                <span>
                    Completed
                </span>

                <strong>
                    ${completed}
                </strong>

            </div>

        </div>

        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-header">

                    <h3>
                        Recent Requests
                    </h3>

                    <button
                        class="text-button"
                        onclick="showRequestStatus()">

                        View All

                    </button>

                </div>

                <div class="ticket-list">

                    ${recentHTML}

                </div>

            </div>

            ${adminPanel}

        </div>

        `
    );
}

/* =========================
   SUBMIT REQUEST
========================= */

function showSubmitRequest() {

    if (!currentUser) {

        showLogin();

        return;
    }

    if (currentUser.role === "Admin") {

        showQueueManagement();

        return;
    }

    document.getElementById(
        "app"
    ).innerHTML = pageShell(
        "submit",
        "Submit Request",
        "Create a new IT support request.",
        `

        <form
            class="request-form"
            onsubmit="submitRequest(event)"
        >

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Category
                    </label>

                    <select
                        id="requestCategory"
                        required>

                        <option value="">
                            Select category
                        </option>

                        <option>
                            Hardware
                        </option>

                        <option>
                            Software
                        </option>

                        <option>
                            Network
                        </option>

                        <option>
                            Account / Login
                        </option>

                        <option>
                            Printer
                        </option>

                        <option>
                            Other
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label>
                        Priority
                    </label>

                    <select
                        id="requestPriority"
                        required>

                        <option value="">
                            Select priority
                        </option>

                        <option>
                            Low
                        </option>

                        <option>
                            Medium
                        </option>

                        <option>
                            High
                        </option>

                        <option>
                            Urgent
                        </option>

                    </select>

                </div>

            </div>

            <div class="form-group">

                <label>
                    Subject
                </label>

                <input
                    type="text"
                    id="requestSubject"
                    maxlength="100"
                    placeholder="Briefly describe the issue"
                    required
                >

            </div>

            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    id="requestDescription"
                    rows="6"
                    maxlength="1000"
                    placeholder="Explain the problem in detail"
                    required></textarea>

            </div>

            <div class="form-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="showDashboard()">

                    Cancel

                </button>

                <button
                    type="submit"
                    class="primary-btn">

                    Submit Request

                </button>

            </div>

        </form>

        `
    );
}

function submitRequest(event) {

    event.preventDefault();

    if (
        !currentUser ||
        currentUser.role === "Admin"
    ) {
        return;
    }

    const category =
        document
            .getElementById("requestCategory")
            .value;

    const priority =
        document
            .getElementById("requestPriority")
            .value;

    const subject =
        document
            .getElementById("requestSubject")
            .value
            .trim();

    const description =
        document
            .getElementById("requestDescription")
            .value
            .trim();

    if (
        !category ||
        !priority ||
        !subject ||
        !description
    ) {

        showMessage(
            "Please complete all fields."
        );

        return;
    }

    const ticketNumber =
        "REQ-" +
        String(
            data.tickets.length + 1
        ).padStart(4, "0");

    const ticket = {

        id: generateId("T"),

        ticketNumber,

        userId: currentUser.id,

        userName: currentUser.name,

        category,

        priority,

        subject,

        description,

        status: "Pending",

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };

    data.tickets.push(ticket);

    saveData();

    showMessage(
        "Request submitted successfully!",
        "success"
    );

    setTimeout(
        showRequestStatus,
        700
    );
}

/* =========================
   REQUEST STATUS
========================= */

function showRequestStatus() {

    if (!currentUser) {

        showLogin();

        return;
    }

    const tickets =
        currentUser.role === "Admin"
            ? data.tickets
            : data.tickets.filter(
                ticket =>
                    ticket.userId ===
                    currentUser.id
            );

    const sorted =
        [...tickets].sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    const rows =
        sorted.length
            ? sorted.map(ticket => `

                <div class="request-card">

                    <div class="request-main">

                        <div class="request-title-row">

                            <h3>
                                ${escapeHTML(
                                    ticket.subject
                                )}
                            </h3>

                            <span
                                class="status-badge ${statusClass(
                                    ticket.status
                                )}">

                                ${escapeHTML(
                                    ticket.status
                                )}

                            </span>

                        </div>

                        <p>
                            ${escapeHTML(
                                ticket.description
                            )}
                        </p>

                        <div class="request-meta">

                            <span>
                                <strong>
                                    Ticket:
                                </strong>

                                ${escapeHTML(
                                    ticket.ticketNumber
                                )}
                            </span>

                            <span>
                                <strong>
                                    Category:
                                </strong>

                                ${escapeHTML(
                                    ticket.category
                                )}
                            </span>

                            <span>
                                <strong>
                                    Priority:
                                </strong>

                                ${escapeHTML(
                                    ticket.priority
                                )}
                            </span>

                            <span>
                                <strong>
                                    Created:
                                </strong>

                                ${formatDate(
                                    ticket.createdAt
                                )}
                            </span>

                        </div>

                        ${
                            currentUser.role === "Admin"
                                ? `
                                <div class="request-meta">

                                    <span>

                                        <strong>
                                            Requester:
                                        </strong>

                                        ${escapeHTML(
                                            ticket.userName
                                        )}

                                    </span>

                                </div>
                                `
                                : ""
                        }

                    </div>

                </div>

            `).join("")
            : `
                <div class="empty-state">
                    No requests found.
                </div>
            `;

    document.getElementById(
        "app"
    ).innerHTML = pageShell(
        "status",
        "Request Status",
        "Track and view support requests.",
        `
        <div class="request-list">

            ${rows}

        </div>
        `
    );
}

/* =========================
   ADMIN QUEUE
========================= */

function showQueueManagement() {

    // Not logged in
    if (!currentUser) {
        showLogin();
        return;
    }

    // USER IS NOT ALLOWED
    if (currentUser.role !== "Admin") {
        showMessage(
            "Access denied. Admin account only."
        );

        showDashboard();
        return;
    }

    const sorted = [...data.tickets].sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );

    const rows = sorted.length
        ? sorted.map(ticket => `
            <div class="queue-card">

                <div class="queue-info">

                    <div class="request-title-row">
                        <h3>
                            ${escapeHTML(ticket.ticketNumber)}
                            -
                            ${escapeHTML(ticket.subject)}
                        </h3>

                        <span class="status-badge ${statusClass(ticket.status)}">
                            ${escapeHTML(ticket.status)}
                        </span>
                    </div>

                    <p>
                        ${escapeHTML(ticket.description)}
                    </p>

                    <div class="request-meta">

                        <span>
                            <strong>User:</strong>
                            ${escapeHTML(ticket.userName)}
                        </span>

                        <span>
                            <strong>Category:</strong>
                            ${escapeHTML(ticket.category)}
                        </span>

                        <span>
                            <strong>Priority:</strong>
                            ${escapeHTML(ticket.priority)}
                        </span>

                        <span>
                            <strong>Date:</strong>
                            ${formatDate(ticket.createdAt)}
                        </span>

                    </div>

                </div>

                <div class="queue-actions">

                    <label>
                        Update Status
                    </label>

                    <select
                        onchange="updateTicketStatus('${ticket.id}', this.value)">

                        <option
                            value="Pending"
                            ${ticket.status === "Pending" ? "selected" : ""}>
                            Pending
                        </option>

                        <option
                            value="In Progress"
                            ${ticket.status === "In Progress" ? "selected" : ""}>
                            In Progress
                        </option>

                        <option
                            value="Completed"
                            ${ticket.status === "Completed" ? "selected" : ""}>
                            Completed
                        </option>

                    </select>

                </div>

            </div>
        `).join("")
        : `
            <div class="empty-state">
                There are no requests in the queue.
            </div>
        `;

    document.getElementById("app").innerHTML =
        pageShell(
            "queue",
            "Queue Management",
            "Manage all IT support requests.",
            `
            <div class="queue-list">
                ${rows}
            </div>
            `
        );
}

function updateTicketStatus(
    ticketId,
    newStatus
) {

    if (
        !currentUser ||
        currentUser.role !== "Admin"
    ) {

        showLogin();

        return;
    }

    const allowed = [
        "Pending",
        "In Progress",
        "Completed"
    ];

    if (!allowed.includes(newStatus)) {

        showMessage(
            "Invalid ticket status."
        );

        return;
    }

    const ticket =
        data.tickets.find(
            item =>
                item.id === ticketId
        );

    if (!ticket) {

        showMessage(
            "Ticket not found."
        );

        return;
    }

    ticket.status = newStatus;

    ticket.updatedAt =
        new Date().toISOString();

    saveData();

    showMessage(
        "Ticket status updated successfully.",
        "success"
    );

    showQueueManagement();
}

/* =========================
   LOGOUT
========================= */

function logout() {

    currentUser = null;

    localStorage.removeItem(
        SESSION_KEY
    );

    showLogin();
}

/* =========================
   START
========================= */

loadData();

render();

function render() {

    if (currentUser) {

        showDashboard();

    } else {

        showLogin();

    }
}