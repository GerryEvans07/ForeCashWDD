/* Menjalankan fungsi halaman sesuai <body data-page="...">. Setiap file di js/pages/ mendaftarkan dirinya ke objek pages. */

const pages = {};

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'login') return pages.login();
    const roleFor = { ortu: 'orangtua', akun: null };
    const user = requireLogin(page in roleFor ? roleFor[page] : 'mahasiswa');
    if (!user) return;
    const active = page === 'wallet' ? 'dashboard' : page;
    renderLayout(user, active);
    pages[page](user);
    initChatbot(user);
});
