/* Login, sesi, dan pembatasan halaman sesuai peran. */

/* ---------------- autentikasi ---------------- */
function currentUser() {
    const uid = Number(localStorage.getItem(SES_KEY));
    return DB.users.find(u => u.user_id === uid) || null;
}
function homeFor(user) { return user.role === 'orangtua' ? 'ortu.html' : 'dashboard.html'; }
function requireLogin(role) {
    const u = currentUser();
    if (!u) { location.href = 'login.html'; return null; }
    if (role && u.role !== role) { location.href = homeFor(u); return null; }
    return u;
}
function logout() { localStorage.removeItem(SES_KEY); location.href = 'login.html'; }
function makeCode() { return Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, 'X'); }
