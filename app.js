/* =====================================================================
   ForeCash — logika aplikasi (versi front-end, tanpa database)
   Data disimpan sementara di localStorage browser. Strukturnya sengaja
   dibuat sama dengan tabel di database.sql supaya nanti mudah dipindah
   ke PHP + MySQL.
   ===================================================================== */

const DB_KEY = 'forecash_db';
const SES_KEY = 'forecash_session';

/* ---------------- helper umum ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function rupiah(n) { return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }

function ymd(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function today() { return ymd(new Date()); }
function addDays(dateStr, n) { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
function diffDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function tgl(dateStr) {
    const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
}
function thisMonth() { return today().slice(0, 7); }

function toast(msg, isError = false) {
    let t = $('#toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'fixed bottom-5 right-5 z-[100] max-w-sm px-5 py-3 rounded-full shadow-xl text-sm font-bold text-white';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? '#E96868' : '#292929';
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 2800);
}

/* ---------------- "database" di localStorage ---------------- */
function loadDB() {
    try { const raw = localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* abaikan */ }
    const db = seedDB();
    saveDB(db);
    return db;
}
function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* abaikan */ } }
let DB = loadDB();
function commit() { saveDB(DB); }

// ID otomatis bertambah (auto increment), tidak pernah diubah, tidak ditampilkan ke pengguna
function nextId(table) { DB.seq[table] = (DB.seq[table] || 0) + 1; return DB.seq[table]; }

function seedDB() {
    const db = { seq: {}, users: [], parent_links: [], wallets: [], categories: [], transactions: [], income_schedules: [], debts: [] };
    const id = t => (db.seq[t] = (db.seq[t] || 0) + 1);
    const cat = (nama, jenis) => db.categories.push({ category_id: id('categories'), user_id: null, nama, jenis });
    ['Makan & Minum', 'Transportasi', 'Kos / Sewa', 'Kebutuhan Kuliah', 'Hiburan', 'Lainnya'].forEach(n => cat(n, 'pengeluaran'));
    ['Uang Saku', 'Kerja Sampingan', 'Beasiswa'].forEach(n => cat(n, 'pemasukan'));
    cat('Pelunasan Utang/Piutang', 'pemasukan'); cat('Pelunasan Utang/Piutang', 'pengeluaran');

    // akun demo
    db.users.push({ user_id: id('users'), nama: 'Momo Mahasiswa', email: 'demo@forecash.id', password: 'demo12345', role: 'mahasiswa', kode_hubung: 'DEMO2026', batas_harian: 45000 });
    db.users.push({ user_id: id('users'), nama: 'Ibu Momo', email: 'ortu@forecash.id', password: 'demo12345', role: 'orangtua', kode_hubung: null, batas_harian: 0 });
    db.parent_links.push({ link_id: id('parent_links'), parent_id: 2, student_id: 1 });

    const w = (nama, tipe, saldo_awal) => db.wallets.push({ wallet_id: id('wallets'), user_id: 1, nama, tipe, saldo_awal });
    w('Utama', 'tunai', 250000); w('BCA', 'bank', 0); w('GoPay', 'ewallet', 0);

    const t0 = today();
    const tx = (hariLalu, wallet_id, jenis, category_id, nominal, keterangan, wallet_tujuan_id = null) =>
        db.transactions.push({ transaction_id: id('transactions'), user_id: 1, wallet_id, wallet_tujuan_id, category_id, jenis, nominal, keterangan, tanggal: addDays(t0, -hariLalu) });
    tx(13, 2, 'pemasukan', 7, 1000000, 'Uang saku bulanan');
    tx(12, 2, 'transfer', null, 300000, 'Isi GoPay', 3);
    tx(12, 3, 'pengeluaran', 1, 85000, 'Makan bareng teman');
    tx(11, 2, 'pengeluaran', 3, 250000, 'Bayar kos (cicilan)');
    tx(9, 3, 'pengeluaran', 2, 40000, 'Ojek online');
    tx(8, 1, 'pengeluaran', 1, 60000, 'Makan kantin');
    tx(6, 3, 'pengeluaran', 5, 75000, 'Nonton bioskop');
    tx(5, 1, 'pengeluaran', 4, 35000, 'Print tugas');
    tx(3, 3, 'pengeluaran', 1, 55000, 'Kopi & camilan');
    tx(2, 1, 'pengeluaran', 2, 30000, 'Bensin');
    tx(1, 1, 'pengeluaran', 1, 45000, 'Makan siang');

    db.income_schedules.push({ schedule_id: id('income_schedules'), user_id: 1, sumber: 'Uang saku dari orang tua', nominal: 1000000, tanggal_perkiraan: addDays(t0, 13), status: 'menunggu' });
    db.debts.push({ debt_id: id('debts'), user_id: 1, nama_teman: 'Andi', keterangan: 'Patungan makan', nominal: 28000, arah: 'piutang', status: 'belum', jatuh_tempo: addDays(t0, 3) });
    db.debts.push({ debt_id: id('debts'), user_id: 1, nama_teman: 'Sasa', keterangan: 'Pinjam ongkos', nominal: 20000, arah: 'utang', status: 'belum', jatuh_tempo: null });
    return db;
}

function resetDemo() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SES_KEY);
    location.href = 'login.html';
}

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

/* ---------------- data & perhitungan ---------------- */
function walletsWithBalance(uid) {
    return DB.wallets.filter(w => w.user_id === uid).map(w => {
        let saldo = Number(w.saldo_awal);
        DB.transactions.forEach(t => {
            if (t.wallet_id === w.wallet_id) saldo += t.jenis === 'pemasukan' ? t.nominal : -t.nominal; // pengeluaran & transfer keluar
            if (t.jenis === 'transfer' && t.wallet_tujuan_id === w.wallet_id) saldo += t.nominal;        // transfer masuk
        });
        return { ...w, saldo };
    });
}
function categoriesFor(uid) { return DB.categories.filter(c => c.user_id === null || c.user_id === uid); }
function categoryName(id) { return DB.categories.find(c => c.category_id === id)?.nama || '-'; }
function walletName(id) { return DB.wallets.find(w => w.wallet_id === id)?.nama || '-'; }
function txOf(uid) { return DB.transactions.filter(t => t.user_id === uid); }

/* inti ForeCash: burn rate, runway, dan status peringatan dini */
function forecast(uid) {
    const t0 = today();
    const saldo = walletsWithBalance(uid).reduce((s, w) => s + w.saldo, 0);
    const keluarSemua = txOf(uid).filter(t => t.jenis === 'pengeluaran');   // transfer TIDAK dihitung

    let hari = 14;
    if (keluarSemua.length) {
        const pertama = keluarSemua.map(t => t.tanggal).sort()[0];
        hari = Math.max(3, Math.min(14, diffDays(pertama, t0) + 1));
    }
    const batasAwal = addDays(t0, -hari);
    const keluar = keluarSemua.filter(t => t.tanggal > batasAwal).reduce((s, t) => s + t.nominal, 0);
    const burn = keluar / hari;

    const runway = burn > 0 ? Math.floor(Math.max(0, saldo) / burn) : null;
    const habis = runway !== null ? addDays(t0, runway) : null;

    const jadwal = DB.income_schedules.filter(s => s.user_id === uid && s.status === 'menunggu')
        .sort((a, b) => a.tanggal_perkiraan.localeCompare(b.tanggal_perkiraan));
    const next = jadwal.find(s => s.tanggal_perkiraan >= t0) || null;
    const terlambat = jadwal.filter(s => s.tanggal_perkiraan < t0);
    const sisaHari = next ? diffDays(t0, next.tanggal_perkiraan) : null;
    const batasAman = next && sisaHari > 0 ? Math.max(0, saldo) / sisaHari : null;

    let status = 'aman';
    if (saldo <= 0) status = 'kritis';
    else if (runway !== null && sisaHari !== null && runway < sisaHari) status = (sisaHari - runway > 3) ? 'kritis' : 'waspada';
    if (status === 'aman' && terlambat.length) status = 'waspada';

    return { saldo, burn, hari, runway, habis, next, sisaHari, batasAman, terlambat, status };
}

function reportData(uid, bulan) {
    const tx = txOf(uid).filter(t => t.tanggal.slice(0, 7) === bulan);
    const masuk = tx.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0);
    const keluar = tx.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0);
    const map = {};
    tx.filter(t => t.jenis === 'pengeluaran').forEach(t => { const k = categoryName(t.category_id); map[k] = (map[k] || 0) + t.nominal; });
    const perKategori = Object.entries(map).map(([kategori, total]) => ({ kategori, total })).sort((a, b) => b.total - a.total);
    const rasio = masuk > 0 ? Math.round((masuk - keluar) / masuk * 100) : null;
    return { masuk, keluar, perKategori, rasio };
}

/* ---------------- tampilan bersama ---------------- */
const charts = {};
function drawChart(id, config) {
    if (!window.Chart || !document.getElementById(id)) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
}

function renderLayout(user, active) {
    const menus = user.role === 'orangtua'
        ? [['ortu', 'ortu.html', 'fa-eye', 'Pantau Anak']]
        : [['dashboard', 'dashboard.html', 'fa-gauge-high', 'Dashboard'],
           ['transaksi', 'transaksi.html', 'fa-receipt', 'Transaksi'],
           ['utang', 'utang.html', 'fa-users', 'Utang & Patungan'],
           ['prediksi', 'prediksi.html', 'fa-chart-line', 'Prediksi & Notifikasi'],
           ['laporan', 'laporan.html', 'fa-chart-pie', 'Laporan']];

    $('#appHeader').innerHTML = `
        ${user.role === 'orangtua' ? `<div class="bg-purple-600 text-white text-xs font-bold py-2 px-4 text-center">
            <i class="fa-solid fa-eye"></i> Mode Pantau Orang Tua — data hanya dapat dilihat, tidak dapat diubah.</div>` : ''}
        <header class="sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-4 border-b">
          <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
            <a href="${homeFor(user)}" class="flex items-center gap-3">
              <div class="w-10 h-10 bg-hsOrange rounded-2xl flex items-center justify-center shadow-md">
                <div class="flex gap-1.5"><span class="w-1.5 h-2 bg-hsDark rounded-full"></span><span class="w-1.5 h-2 bg-hsDark rounded-full"></span></div>
              </div>
              <div><h1 class="text-2xl font-black text-hsDark leading-none">ForeCash</h1>
                   <p class="text-[11px] font-bold text-hsOrange">Financial Early Warning</p></div>
            </a>
            <nav class="flex items-center gap-1.5 overflow-x-auto py-1 order-3 lg:order-none w-full lg:w-auto">
              ${menus.map(([key, href, icon, label]) => `
                <a href="${href}" class="nav-tab ${active === key ? 'active' : ''} px-3.5 py-2 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
                  <i class="fa-solid ${icon}"></i> ${label}</a>`).join('')}
            </nav>
            <div class="flex items-center gap-2">
              <a href="akun.html" class="nav-tab ${active === 'akun' ? 'active' : ''} flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100">
                <span class="w-6 h-6 rounded-full bg-hsPurple text-white font-black text-xs flex items-center justify-center">${esc(user.nama[0].toUpperCase())}</span>
                <span class="text-xs font-bold text-hsDark">${esc(user.nama.split(' ')[0])}</span>
                <span class="text-[9px] bg-hsYellow text-hsDark px-2 py-0.5 rounded-full font-black uppercase">${user.role === 'orangtua' ? 'Orang Tua' : 'Mahasiswa'}</span>
              </a>
              <button onclick="logout()" class="hs-btn bg-slate-200 text-slate-700 px-3 py-1.5 text-xs" title="Keluar"><i class="fa-solid fa-right-from-bracket"></i></button>
            </div>
          </div>
        </header>`;

    $('#appFooter').innerHTML = `<footer class="py-4 px-4 text-center text-xs font-bold text-slate-400 border-t">
        ForeCash © 2026 — Calm & Transparent Student Financial Planning</footer>`;
}

function warningHTML(f) {
    const warna = { aman: 'bg-emerald-100', waspada: 'bg-hsYellow', kritis: 'bg-red-200' }[f.status];
    const label = { aman: 'Aman', waspada: 'Waspada', kritis: 'Kritis' }[f.status];
    const pct = (f.runway !== null && f.sisaHari) ? Math.min(100, Math.round(f.runway / Math.max(1, f.sisaHari) * 100)) : 100;
    let judul;
    if (f.burn <= 0) judul = 'Belum ada pengeluaran yang tercatat.';
    else if (f.saldo <= 0) judul = 'Saldo sudah habis.';
    else judul = `Saldo diproyeksikan habis pada <span class="bg-hsOrange text-white px-3 py-0.5 rounded-2xl inline-block">${tgl(f.habis)}</span>`;

    const info = f.next
        ? `${esc(f.next.sumber)} berikutnya dijadwalkan <strong>${tgl(f.next.tanggal_perkiraan)}</strong> (${f.sisaHari} hari lagi).
           ${f.status !== 'aman' && f.batasAman !== null ? `Batas pengeluaran harian yang aman: <strong>${rupiah(f.batasAman)}/hari</strong>.` : ''}`
        : 'Belum ada jadwal pemasukan berikutnya. Tambahkan di menu Prediksi agar peringatan lebih akurat.';

    return `
    <div class="${warna} p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-3 max-w-xl text-center md:text-left">
        <div class="inline-flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full text-xs font-extrabold">
          <i class="fa-solid fa-bell text-hsOrange"></i> Peringatan Dini · Status ${label}</div>
        <h2 class="text-2xl sm:text-3xl font-black text-hsDark leading-snug">${judul}</h2>
        <p class="text-sm font-medium text-hsDark/80">${info}</p>
        ${f.terlambat.map(t => `<p class="text-sm font-bold text-hsRed"><i class="fa-solid fa-triangle-exclamation"></i>
            ${esc(t.sumber)} (${rupiah(t.nominal)}) terlambat sejak ${tgl(t.tanggal_perkiraan)}.</p>`).join('')}
        ${f.runway !== null ? `
        <div class="pt-2 space-y-1">
          <div class="flex justify-between text-xs font-bold"><span>Daya tahan saldo (runway)</span>
            <span class="bg-white px-2.5 py-0.5 rounded-full">${f.runway} hari lagi</span></div>
          <div class="w-full bg-white/60 rounded-full h-4 p-0.5"><div class="bg-hsOrange h-full rounded-full" style="width:${pct}%"></div></div>
        </div>` : ''}
      </div>
      <div class="w-32 h-32 shrink-0 character-bounce">
        <div class="w-32 h-32 bg-hsOrange rounded-full shadow-lg flex flex-col items-center justify-center border-4 border-white">
          <div class="flex gap-4 mb-2"><div class="w-4 h-5 bg-hsDark rounded-full hs-eye"></div><div class="w-4 h-5 bg-hsDark rounded-full hs-eye"></div></div>
          ${f.status === 'aman' ? '<div class="w-8 h-4 border-b-4 border-hsDark rounded-full"></div>' : '<div class="w-8 h-2 bg-hsDark rounded-full"></div>'}
        </div>
      </div>
    </div>`;
}

function reportHTML(r, chartId) {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="hs-card p-6 space-y-3">
        <h4 class="text-sm font-black text-center">Pengeluaran per Kategori</h4>
        ${r.perKategori.length ? `<div class="h-60 relative"><canvas id="${chartId}"></canvas></div>`
                               : '<p class="text-xs text-slate-500 text-center">Belum ada pengeluaran di bulan ini.</p>'}
      </div>
      <div class="hs-card p-6 space-y-3 text-sm">
        <h4 class="text-sm font-black">Ringkasan</h4>
        <p class="flex justify-between border-b py-2"><span class="text-slate-500">Total pemasukan</span><b class="text-hsGreen">${rupiah(r.masuk)}</b></p>
        <p class="flex justify-between border-b py-2"><span class="text-slate-500">Total pengeluaran</span><b class="text-hsRed">${rupiah(r.keluar)}</b></p>
        <p class="flex justify-between border-b py-2"><span class="text-slate-500">Rasio tabungan</span><b class="text-hsBlue">${r.rasio === null ? '-' : r.rasio + '%'}</b></p>
        ${r.perKategori.map(k => `<p class="flex justify-between text-xs"><span>${esc(k.kategori)}</span><span>${rupiah(k.total)}</span></p>`).join('')}
      </div>
    </div>`;
}
function drawReportChart(r, chartId) {
    if (!r.perKategori.length) return;
    drawChart(chartId, {
        type: 'doughnut',
        data: { labels: r.perKategori.map(k => k.kategori),
                datasets: [{ data: r.perKategori.map(k => k.total), backgroundColor: ['#FF7043', '#FFC83D', '#5B8DEF', '#43B883', '#8B6FE8', '#E96868', '#94A3B8'] }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function txRowHTML(t, withActions) {
    const warna = { pemasukan: 'text-hsGreen', pengeluaran: 'text-hsRed', transfer: 'text-hsBlue' }[t.jenis];
    const tanda = { pemasukan: '+', pengeluaran: '−', transfer: '⇄ ' }[t.jenis];
    const detail = t.jenis === 'transfer'
        ? `${esc(walletName(t.wallet_id))} → ${esc(walletName(t.wallet_tujuan_id))}`
        : `${esc(categoryName(t.category_id))} · ${esc(walletName(t.wallet_id))}`;
    return `
    <div class="flex justify-between items-center gap-3 border-b last:border-0 py-2">
      <div class="text-sm min-w-0"><p class="font-bold truncate">${esc(t.keterangan)}</p>
        <p class="text-xs text-slate-500">${tgl(t.tanggal)} · ${detail}</p></div>
      <div class="flex items-center gap-2 shrink-0">
        <p class="text-sm font-black ${warna}">${tanda}${rupiah(t.nominal)}</p>
        ${withActions ? `
        <button data-edit="${t.transaction_id}" class="w-8 h-8 rounded-full bg-slate-100 text-xs" title="Ubah"><i class="fa-solid fa-pen"></i></button>
        <button data-hapus="${t.transaction_id}" class="w-8 h-8 rounded-full bg-red-50 text-hsRed text-xs" title="Hapus"><i class="fa-solid fa-trash"></i></button>` : ''}
      </div>
    </div>`;
}

function walletOptions(uid, withSaldo) {
    return walletsWithBalance(uid).map(w => `<option value="${w.wallet_id}">${esc(w.nama)}${withSaldo ? ` (${rupiah(w.saldo)})` : ''}</option>`).join('');
}

/* =====================================================================
   HALAMAN
   ===================================================================== */
const pages = {};

/* ---------- LOGIN & REGISTRASI ---------- */
pages.login = function () {
    const u = currentUser();
    if (u) { location.href = homeFor(u); return; }
    let mode = 'masuk';
    function setMode(m) {
        mode = m;
        $('#tabMasuk').className = `w-1/2 py-2 text-sm font-bold rounded-xl ${m === 'masuk' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500'}`;
        $('#tabDaftar').className = `w-1/2 py-2 text-sm font-bold rounded-xl ${m === 'daftar' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500'}`;
        $$('.only-daftar').forEach(el => el.classList.toggle('hidden', m !== 'daftar'));
        $('#nama').required = m === 'daftar';
        $('#btnSubmit').textContent = m === 'daftar' ? 'Buat Akun' : 'Masuk';
        $('#authError').textContent = '';
    }
    $('#tabMasuk').onclick = () => setMode('masuk');
    $('#tabDaftar').onclick = () => setMode('daftar');
    setMode(location.hash === '#daftar' ? 'daftar' : 'masuk');

    $('#authForm').onsubmit = e => {
        e.preventDefault();
        const email = $('#email').value.trim().toLowerCase(), pass = $('#password').value;
        const err = msg => { $('#authError').textContent = msg; };
        if (mode === 'daftar') {
            const nama = $('#nama').value.trim(), role = $('#role').value;
            if (!nama) return err('Nama wajib diisi.');
            if (pass.length < 8) return err('Kata sandi minimal 8 karakter.');
            if (DB.users.some(x => x.email === email)) return err('Email sudah digunakan.');
            const user = { user_id: nextId('users'), nama, email, password: pass, role, kode_hubung: role === 'mahasiswa' ? makeCode() : null, batas_harian: 0 };
            DB.users.push(user);
            if (role === 'mahasiswa') DB.wallets.push({ wallet_id: nextId('wallets'), user_id: user.user_id, nama: 'Utama', tipe: 'tunai', saldo_awal: 0 });
            commit();
            localStorage.setItem(SES_KEY, user.user_id);
            location.href = homeFor(user);
        } else {
            const user = DB.users.find(x => x.email === email && x.password === pass);
            if (!user) return err('Email atau kata sandi salah.');
            localStorage.setItem(SES_KEY, user.user_id);
            location.href = homeFor(user);
        }
    };
};

/* ---------- DASHBOARD ---------- */
pages.dashboard = function (user) {
    const uid = user.user_id, f = forecast(uid);
    const belum = DB.debts.filter(d => d.user_id === uid && d.status === 'belum');
    $('#warning').innerHTML = warningHTML(f);
    $('#statSaldo').textContent = rupiah(f.saldo);
    $('#statBurn').textContent = rupiah(f.burn);
    $('#statBurnInfo').textContent = `rata-rata ${f.hari} hari terakhir`;
    $('#statPiutang').textContent = rupiah(belum.filter(d => d.arah === 'piutang').reduce((s, d) => s + d.nominal, 0));
    $('#statUtang').textContent = rupiah(belum.filter(d => d.arah === 'utang').reduce((s, d) => s + d.nominal, 0));

    const ikon = { tunai: 'fa-money-bill-wave', bank: 'fa-building-columns', ewallet: 'fa-mobile-screen' };
    const warna = ['bg-hsYellow', 'bg-blue-100', 'bg-emerald-100', 'bg-purple-100', 'bg-orange-100'];
    $('#walletCards').innerHTML = walletsWithBalance(uid).map((w, i) => `
        <div class="wallet-card ${warna[i % 5]} rounded-3xl p-5">
          <p class="text-xs font-bold"><i class="fa-solid ${ikon[w.tipe]}"></i> ${esc(w.nama)}</p>
          <p class="text-xl font-black mt-2">${rupiah(w.saldo)}</p>
        </div>`).join('');

    const recent = txOf(uid).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.transaction_id - a.transaction_id).slice(0, 5);
    $('#recentList').innerHTML = recent.length ? recent.map(t => txRowHTML(t, false)).join('') : '<p class="text-xs text-slate-500">Belum ada transaksi.</p>';
};

/* ---------- KELOLA WALLET ---------- */
pages.wallet = function (user) {
    const uid = user.user_id;
    const labelTipe = { tunai: 'Tunai', bank: 'Bank', ewallet: 'E-Wallet' };
    const tipeOpts = sel => Object.entries(labelTipe).map(([k, l]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${l}</option>`).join('');

    function render() {
        $('#walletList').innerHTML = walletsWithBalance(uid).map(w => `
          <form data-id="${w.wallet_id}" class="wallet-row grid grid-cols-1 sm:grid-cols-12 gap-2 items-end border-b last:border-0 pb-3">
            <div class="sm:col-span-4"><label class="text-[11px] font-bold">Nama</label><input name="nama" value="${esc(w.nama)}" required class="w-full px-3 py-2 text-xs border"></div>
            <div class="sm:col-span-3"><label class="text-[11px] font-bold">Tipe</label><select name="tipe" class="w-full px-3 py-2 text-xs border">${tipeOpts(w.tipe)}</select></div>
            <div class="sm:col-span-3"><label class="text-[11px] font-bold">Saldo awal</label><input type="number" name="saldo_awal" min="0" value="${w.saldo_awal}" class="w-full px-3 py-2 text-xs border"></div>
            <div class="sm:col-span-2 flex gap-1">
              <button class="hs-btn bg-hsBlue text-white px-3 py-2 text-xs" title="Simpan"><i class="fa-solid fa-floppy-disk"></i></button>
              <button type="button" data-hapus="${w.wallet_id}" class="hs-btn bg-hsRed text-white px-3 py-2 text-xs" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
            <p class="sm:col-span-12 text-xs text-slate-500">Saldo saat ini: <strong>${rupiah(w.saldo)}</strong></p>
          </form>`).join('');

        $$('.wallet-row').forEach(form => form.onsubmit = e => {
            e.preventDefault();
            const w = DB.wallets.find(x => x.wallet_id === Number(form.dataset.id) && x.user_id === uid);
            const nama = form.nama.value.trim();
            if (!nama) return toast('Nama wallet wajib diisi.', true);
            Object.assign(w, { nama, tipe: form.tipe.value, saldo_awal: Math.max(0, Number(form.saldo_awal.value) || 0) });
            commit(); render(); toast('Wallet diperbarui.');
        });
        $$('[data-hapus]').forEach(btn => btn.onclick = () => {
            const wid = Number(btn.dataset.hapus);
            if (DB.wallets.filter(w => w.user_id === uid).length <= 1) return toast('Minimal harus ada satu wallet.', true);
            if (DB.transactions.some(t => t.wallet_id === wid || t.wallet_tujuan_id === wid)) return toast('Wallet masih dipakai di transaksi, tidak dapat dihapus.', true);
            if (!confirm('Hapus wallet ini?')) return;
            DB.wallets = DB.wallets.filter(w => !(w.wallet_id === wid && w.user_id === uid));
            commit(); render(); toast('Wallet dihapus.');
        });
    }

    $('#tipeBaru').innerHTML = tipeOpts('tunai');
    $('#formWallet').onsubmit = e => {
        e.preventDefault();
        const nama = $('#namaBaru').value.trim();
        if (!nama) return toast('Nama wallet wajib diisi.', true);
        DB.wallets.push({ wallet_id: nextId('wallets'), user_id: uid, nama, tipe: $('#tipeBaru').value, saldo_awal: Math.max(0, Number($('#saldoBaru').value) || 0) });
        commit(); e.target.reset(); render(); toast('Wallet ditambahkan.');
    };
    render();
};

/* ---------- TRANSAKSI ---------- */
pages.transaksi = function (user) {
    const uid = user.user_id;
    let editingId = null;
    const form = $('#txForm');

    function fillSelects() {
        form.wallet_id.innerHTML = walletOptions(uid, true);
        form.wallet_tujuan_id.innerHTML = walletOptions(uid, false);
        form.category_id.innerHTML = categoriesFor(uid).map(c => `<option value="${c.category_id}" data-jenis="${c.jenis}">${esc(c.nama)}</option>`).join('');
    }
    function syncJenis() {
        const j = form.jenis.value, transfer = j === 'transfer';
        $('#boxKategori').classList.toggle('hidden', transfer);
        $('#boxTujuan').classList.toggle('hidden', !transfer);
        $('#lblWallet').textContent = transfer ? 'Dari wallet' : 'Wallet';
        const opts = [...form.category_id.options];
        opts.forEach(o => { o.hidden = o.dataset.jenis !== j; });
        if (form.category_id.selectedOptions[0]?.hidden) { const first = opts.find(o => !o.hidden); if (first) first.selected = true; }
    }
    function resetForm() {
        editingId = null; form.reset(); form.tanggal.value = today();
        $('#txFormTitle').textContent = 'Catat Transaksi';
        $('#btnSimpanTx').textContent = 'Simpan Transaksi';
        $('#btnBatalEdit').classList.add('hidden');
        syncJenis();
    }

    function validate() {
        const jenis = form.jenis.value, nominal = Number(form.nominal.value), tanggal = form.tanggal.value;
        const wallet_id = Number(form.wallet_id.value), tujuan = Number(form.wallet_tujuan_id.value);
        let keterangan = form.keterangan.value.trim(), category_id = Number(form.category_id.value);
        if (!(nominal > 0)) return 'Nominal harus lebih dari 0.';
        if (!tanggal) return 'Tanggal wajib diisi.';
        if (tanggal > today()) return 'Tanggal tidak boleh melebihi hari ini.';
        if (jenis === 'transfer') {
            if (tujuan === wallet_id) return 'Wallet asal dan tujuan tidak boleh sama.';
            return { jenis, nominal, tanggal, wallet_id, wallet_tujuan_id: tujuan, category_id: null, keterangan: keterangan || 'Transfer antar wallet' };
        }
        if (!keterangan) return 'Keterangan wajib diisi.';
        return { jenis, nominal, tanggal, wallet_id, wallet_tujuan_id: null, category_id, keterangan };
    }

    form.jenis.onchange = syncJenis;
    $('#btnBatalEdit').onclick = resetForm;
    form.onsubmit = e => {
        e.preventDefault();
        const v = validate();
        if (typeof v === 'string') return toast(v, true);
        if (editingId) {
            Object.assign(DB.transactions.find(t => t.transaction_id === editingId && t.user_id === uid), v);
            toast('Transaksi diperbarui.');
        } else {
            DB.transactions.push({ transaction_id: nextId('transactions'), user_id: uid, ...v });
            toast('Transaksi tersimpan.');
        }
        commit(); fillSelects(); resetForm(); renderList(); renderBatas();
    };

    function renderList() {
        const bulan = $('#filterBulan').value || thisMonth();
        const list = txOf(uid).filter(t => t.tanggal.slice(0, 7) === bulan)
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.transaction_id - a.transaction_id);
        $('#txList').innerHTML = list.length ? list.map(t => txRowHTML(t, true)).join('') : '<p class="text-xs text-slate-500">Belum ada transaksi di bulan ini.</p>';
        $$('[data-hapus]', $('#txList')).forEach(b => b.onclick = () => {
            if (!confirm('Hapus transaksi ini?')) return;
            DB.transactions = DB.transactions.filter(t => !(t.transaction_id === Number(b.dataset.hapus) && t.user_id === uid));
            commit(); fillSelects(); renderList(); renderBatas(); toast('Transaksi dihapus.');
        });
        $$('[data-edit]', $('#txList')).forEach(b => b.onclick = () => {
            const t = DB.transactions.find(x => x.transaction_id === Number(b.dataset.edit) && x.user_id === uid);
            editingId = t.transaction_id;
            form.jenis.value = t.jenis; syncJenis();
            form.nominal.value = t.nominal; form.keterangan.value = t.keterangan; form.tanggal.value = t.tanggal;
            form.wallet_id.value = t.wallet_id;
            if (t.category_id) form.category_id.value = t.category_id;
            if (t.wallet_tujuan_id) form.wallet_tujuan_id.value = t.wallet_tujuan_id;
            $('#txFormTitle').textContent = 'Ubah Transaksi';
            $('#btnSimpanTx').textContent = 'Simpan Perubahan';
            $('#btnBatalEdit').classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        });
    }

    function renderBatas() {
        $('#batasHarian').value = user.batas_harian || 0;
        const hariIni = txOf(uid).filter(t => t.jenis === 'pengeluaran' && t.tanggal === today()).reduce((s, t) => s + t.nominal, 0);
        const el = $('#batasStatus');
        if (user.batas_harian > 0) {
            const lewat = hariIni > user.batas_harian;
            el.className = `text-[11px] font-bold ${lewat ? 'text-hsRed' : 'text-hsGreen'}`;
            el.textContent = `Hari ini: ${rupiah(hariIni)} dari ${rupiah(user.batas_harian)} — ${lewat ? 'melebihi batas!' : 'masih aman.'}`;
        } else el.textContent = '';
    }
    $('#formBatas').onsubmit = e => {
        e.preventDefault();
        user.batas_harian = Math.max(0, Number($('#batasHarian').value) || 0);
        commit(); renderBatas(); toast('Batas harian diperbarui.');
    };

    function renderKategori() {
        const mine = DB.categories.filter(c => c.user_id === uid);
        $('#kategoriChips').innerHTML = mine.length ? mine.map(c => `
            <span class="inline-flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-[11px] font-bold">${esc(c.nama)}
              <button data-hapus-kat="${c.category_id}" class="w-5 h-5 rounded-full hover:bg-white" title="Hapus">×</button></span>`).join('')
            : '<p class="text-xs text-slate-500">Kategori bawaan sudah tersedia. Tambahkan kategori khusus di sini.</p>';
        $$('[data-hapus-kat]').forEach(b => b.onclick = () => {
            const id = Number(b.dataset.hapusKat);
            DB.categories = DB.categories.filter(c => !(c.category_id === id && c.user_id === uid));
            DB.transactions.forEach(t => { if (t.category_id === id) t.category_id = null; });
            commit(); fillSelects(); syncJenis(); renderKategori(); renderList(); toast('Kategori dihapus.');
        });
    }
    $('#formKategori').onsubmit = e => {
        e.preventDefault();
        const nama = $('#namaKategori').value.trim();
        if (!nama) return toast('Nama kategori wajib diisi.', true);
        DB.categories.push({ category_id: nextId('categories'), user_id: uid, nama, jenis: $('#jenisKategori').value });
        commit(); e.target.reset(); fillSelects(); syncJenis(); renderKategori(); toast('Kategori ditambahkan.');
    };

    $('#filterBulan').value = thisMonth();
    $('#filterBulan').onchange = renderList;
    form.tanggal.max = today();
    fillSelects(); resetForm(); renderList(); renderBatas(); renderKategori();
    if (location.hash === '#form') form.nominal.focus();
};

/* ---------- UTANG & PATUNGAN ---------- */
pages.utang = function (user) {
    const uid = user.user_id;

    function render() {
        const belum = DB.debts.filter(d => d.user_id === uid && d.status === 'belum')
            .sort((a, b) => (a.jatuh_tempo || '9999').localeCompare(b.jatuh_tempo || '9999'));
        const lunas = DB.debts.filter(d => d.user_id === uid && d.status === 'lunas').slice(-10).reverse();
        const opts = walletOptions(uid, false);

        $('#debtList').innerHTML = belum.length ? belum.map(d => {
            const telat = d.jatuh_tempo && d.jatuh_tempo < today();
            const pesan = encodeURIComponent(`Halo ${d.nama_teman}, sekadar mengingatkan untuk ${d.keterangan} sebesar ${rupiah(d.nominal)}. Terima kasih!`);
            return `
            <div class="hs-card p-5 space-y-3 ${telat ? 'border-red-300' : ''}">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${d.arah === 'piutang' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}">
                    ${d.arah === 'piutang' ? 'PIUTANG · dia utang ke saya' : 'UTANG · saya utang ke dia'}</span>
                  <p class="font-black mt-2">${esc(d.nama_teman)}</p>
                  <p class="text-xs text-slate-500">${esc(d.keterangan)}</p>
                </div>
                <p class="font-black">${rupiah(d.nominal)}</p>
              </div>
              ${d.jatuh_tempo ? `<p class="text-[11px] font-bold ${telat ? 'text-hsRed' : 'text-slate-500'}">Jatuh tempo ${tgl(d.jatuh_tempo)}${telat ? ' — terlewat' : ''}</p>` : ''}
              <div class="flex gap-2">
                <select data-wallet="${d.debt_id}" class="flex-1 px-2 py-1.5 text-[11px] border" title="Wallet untuk pelunasan">${opts}</select>
                <button data-lunas="${d.debt_id}" class="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px]">Lunas</button>
                <button data-hapus="${d.debt_id}" class="hs-btn bg-slate-200 px-3 py-1.5 text-[11px]" title="Hapus"><i class="fa-solid fa-trash"></i></button>
              </div>
              ${d.arah === 'piutang' ? `<a href="https://wa.me/?text=${pesan}" target="_blank" rel="noopener" class="text-[11px] font-bold text-hsGreen">
                  <i class="fa-brands fa-whatsapp"></i> Kirim pengingat via WhatsApp</a>` : ''}
            </div>`;
        }).join('') : '<p class="hs-card p-5 text-xs text-slate-500 sm:col-span-2">Tidak ada utang atau piutang yang belum lunas.</p>';

        $('#lunasBox').classList.toggle('hidden', !lunas.length);
        $('#lunasList').innerHTML = lunas.map(d => `<p class="text-xs py-1 border-b last:border-0"><span class="font-bold">${esc(d.nama_teman)}</span> · ${esc(d.keterangan)} · ${rupiah(d.nominal)} <span class="text-hsGreen font-bold">✓</span></p>`).join('');

        $$('[data-lunas]').forEach(b => b.onclick = () => {
            const d = DB.debts.find(x => x.debt_id === Number(b.dataset.lunas) && x.user_id === uid);
            const wid = Number($(`[data-wallet="${d.debt_id}"]`).value);
            const jenis = d.arah === 'piutang' ? 'pemasukan' : 'pengeluaran';   // piutang lunas = uang masuk
            const kat = DB.categories.find(c => c.user_id === null && c.nama === 'Pelunasan Utang/Piutang' && c.jenis === jenis);
            DB.transactions.push({ transaction_id: nextId('transactions'), user_id: uid, wallet_id: wid, wallet_tujuan_id: null,
                category_id: kat ? kat.category_id : null, jenis, nominal: d.nominal, keterangan: `Pelunasan: ${d.nama_teman} - ${d.keterangan}`, tanggal: today() });
            d.status = 'lunas';
            commit(); render(); toast(`Ditandai lunas dan dicatat sebagai ${jenis}.`);
        });
        $$('[data-hapus]', $('#debtList')).forEach(b => b.onclick = () => {
            if (!confirm('Hapus catatan ini?')) return;
            DB.debts = DB.debts.filter(d => !(d.debt_id === Number(b.dataset.hapus) && d.user_id === uid));
            commit(); render(); toast('Catatan dihapus.');
        });
    }

    // pratinjau split bill
    const sbPreview = () => {
        const names = $('#sbTeman').value.split(',').map(s => s.trim()).filter(Boolean), total = Number($('#sbTotal').value);
        $('#sbPreview').textContent = (total > 0 && names.length)
            ? rupiah(Math.round(total / (names.length + ($('#sbSaya').checked ? 1 : 0)))) + ' per orang' : '';
    };
    ['#sbTotal', '#sbTeman', '#sbSaya'].forEach(s => $(s).addEventListener('input', sbPreview));

    $('#formSplit').onsubmit = e => {
        e.preventDefault();
        const total = Number($('#sbTotal').value), judul = $('#sbJudul').value.trim() || 'Split bill';
        const teman = $('#sbTeman').value.split(',').map(s => s.trim()).filter(Boolean);
        if (!(total > 0) || !teman.length) return toast('Isi total tagihan dan minimal satu nama teman.', true);
        const per = Math.round(total / (teman.length + ($('#sbSaya').checked ? 1 : 0)));
        teman.forEach(n => DB.debts.push({ debt_id: nextId('debts'), user_id: uid, nama_teman: n, keterangan: judul, nominal: per, arah: 'piutang', status: 'belum', jatuh_tempo: $('#sbTempo').value || null }));
        commit(); e.target.reset(); sbPreview(); render(); toast(`Split bill dibuat: ${rupiah(per)} per orang.`);
    };

    $('#formDebt').onsubmit = e => {
        e.preventDefault();
        const nama = $('#dNama').value.trim(), ket = $('#dKet').value.trim(), nom = Number($('#dNominal').value);
        if (!nama || !ket || !(nom > 0)) return toast('Nama teman, keterangan, dan nominal wajib diisi.', true);
        DB.debts.push({ debt_id: nextId('debts'), user_id: uid, nama_teman: nama, keterangan: ket, nominal: nom, arah: $('#dArah').value, status: 'belum', jatuh_tempo: $('#dTempo').value || null });
        commit(); e.target.reset(); render(); toast('Catatan disimpan.');
    };
    render();
};

/* ---------- PREDIKSI & NOTIFIKASI ---------- */
pages.prediksi = function (user) {
    const uid = user.user_id;
    let f;

    function render() {
        f = forecast(uid);
        $('#warning').innerHTML = warningHTML(f);
        $('#infoRumus').textContent = `Dihitung otomatis dari transaksi: burn rate = total pengeluaran ${f.hari} hari terakhir ÷ ${f.hari}.`;
        $('#hSaldo').textContent = rupiah(f.saldo);
        $('#hBurn').textContent = rupiah(f.burn) + '/hari';
        $('#hRunway').textContent = f.runway !== null ? f.runway + ' hari' : '-';
        $('#hHabis').textContent = f.habis ? tgl(f.habis) : '-';
        $('#hNext').textContent = f.next ? tgl(f.next.tanggal_perkiraan) : '-';
        $('#simBurn').value = Math.round(f.burn);
        simulasi();

        const jadwal = DB.income_schedules.filter(s => s.user_id === uid && s.status === 'menunggu')
            .sort((a, b) => a.tanggal_perkiraan.localeCompare(b.tanggal_perkiraan));
        const opts = walletOptions(uid, false);
        $('#jadwalList').innerHTML = jadwal.length ? jadwal.map(s => {
            const telat = s.tanggal_perkiraan < today();
            return `
            <div class="flex flex-wrap items-center gap-2 border-b last:border-0 py-2">
              <div class="flex-1 min-w-[160px]">
                <p class="text-sm font-bold">${esc(s.sumber)} · ${rupiah(s.nominal)}</p>
                <p class="text-xs ${telat ? 'text-hsRed font-bold' : 'text-slate-500'}">${tgl(s.tanggal_perkiraan)}${telat ? ' — TERLAMBAT' : ''}</p>
              </div>
              <select data-wallet="${s.schedule_id}" class="px-2 py-1.5 text-[11px] border" title="Masuk ke wallet">${opts}</select>
              <button data-terima="${s.schedule_id}" class="hs-btn bg-hsGreen text-white px-3 py-1.5 text-[11px]">Sudah diterima</button>
              <button data-hapus="${s.schedule_id}" class="hs-btn bg-slate-200 px-3 py-1.5 text-[11px]" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        }).join('') : '<p class="text-xs text-slate-500">Belum ada jadwal. Tambahkan uang saku, honor, atau beasiswa agar peringatan bisa dihitung.</p>';

        $$('[data-terima]').forEach(b => b.onclick = () => {
            const s = DB.income_schedules.find(x => x.schedule_id === Number(b.dataset.terima) && x.user_id === uid);
            const kat = DB.categories.find(c => c.user_id === null && c.nama === 'Uang Saku');
            DB.transactions.push({ transaction_id: nextId('transactions'), user_id: uid, wallet_id: Number($(`[data-wallet="${s.schedule_id}"]`).value),
                wallet_tujuan_id: null, category_id: kat.category_id, jenis: 'pemasukan', nominal: s.nominal, keterangan: s.sumber, tanggal: today() });
            s.status = 'diterima';
            commit(); render(); toast('Pemasukan diterima dan dicatat ke transaksi.');
        });
        $$('[data-hapus]', $('#jadwalList')).forEach(b => b.onclick = () => {
            if (!confirm('Hapus jadwal ini?')) return;
            DB.income_schedules = DB.income_schedules.filter(s => !(s.schedule_id === Number(b.dataset.hapus) && s.user_id === uid));
            commit(); render(); toast('Jadwal dihapus.');
        });
    }

    function drawProjection(burn) {
        const labels = [], data = [];
        for (let i = 0; i <= 30; i++) {
            const d = new Date(); d.setDate(d.getDate() + i);
            labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
            data.push(Math.max(0, Math.round(f.saldo - burn * i)));
        }
        const mark = f.sisaHari !== null && f.sisaHari <= 30 ? f.sisaHari : null;
        $('#markInfo').classList.toggle('hidden', mark === null);
        drawChart('chartProyeksi', {
            type: 'line',
            data: { labels, datasets: [{ label: 'Saldo', data, borderColor: '#FF7043', backgroundColor: 'rgba(255,112,67,.12)', fill: true, tension: .3, pointRadius: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => 'Rp ' + (v / 1000) + 'rb' } } } },
            plugins: [{ id: 'paydayLine', afterDraw(c) {
                if (mark === null) return;
                const x = c.scales.x.getPixelForValue(mark), a = c.chartArea, g = c.ctx;
                g.save(); g.strokeStyle = '#FFC83D'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, a.top); g.lineTo(x, a.bottom); g.stroke(); g.restore();
            } }]
        });
    }

    // simulasi "bagaimana jika pengeluaran per hari diubah"
    function simulasi() {
        const b = Number($('#simBurn').value);
        if (!(b > 0)) { $('#simHasil').textContent = ''; drawProjection(f.burn); return; }
        const run = Math.floor(Math.max(0, f.saldo) / b);
        $('#simHasil').textContent = `Saldo bertahan ${run} hari` + (f.sisaHari !== null
            ? (run >= f.sisaHari ? ' — aman sampai pemasukan berikutnya.' : ` — masih kurang ${f.sisaHari - run} hari.`) : '.');
        drawProjection(b);
    }
    $('#simBurn').addEventListener('input', simulasi);

    $('#formJadwal').onsubmit = e => {
        e.preventDefault();
        const sumber = $('#jSumber').value.trim(), nominal = Number($('#jNominal').value), tanggal = $('#jTanggal').value;
        if (!sumber || !(nominal > 0) || !tanggal) return toast('Sumber, nominal, dan tanggal wajib diisi.', true);
        DB.income_schedules.push({ schedule_id: nextId('income_schedules'), user_id: uid, sumber, nominal, tanggal_perkiraan: tanggal, status: 'menunggu' });
        commit(); e.target.reset(); render(); toast('Jadwal pemasukan ditambahkan.');
    };
    render();
};

/* ---------- LAPORAN ---------- */
pages.laporan = function (user) {
    const uid = user.user_id;
    function render() {
        const bulan = $('#filterBulan').value || thisMonth();
        const r = reportData(uid, bulan);
        $('#report').innerHTML = reportHTML(r, 'chartLaporan');
        drawReportChart(r, 'chartLaporan');
    }
    $('#filterBulan').value = thisMonth();
    $('#filterBulan').onchange = render;

    // ekspor CSV (dibuka dengan Excel)
    $('#btnExport').onclick = () => {
        const bulan = $('#filterBulan').value || thisMonth();
        const rows = [['Tanggal', 'Jenis', 'Keterangan', 'Kategori', 'Wallet', 'Ke Wallet', 'Nominal']];
        txOf(uid).filter(t => t.tanggal.slice(0, 7) === bulan).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).forEach(t =>
            rows.push([t.tanggal, t.jenis, t.keterangan, t.category_id ? categoryName(t.category_id) : '-', walletName(t.wallet_id), t.wallet_tujuan_id ? walletName(t.wallet_tujuan_id) : '', t.nominal]));
        const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `forecash-${bulan}.csv`;
        a.click();
    };
    render();
};

/* ---------- AKUN ---------- */
pages.akun = function (user) {
    const uid = user.user_id;
    $('#pNama').value = user.nama;
    $('#pEmail').value = user.email;
    $('#pRole').textContent = user.role === 'orangtua' ? 'Orang Tua' : 'Mahasiswa';

    $('#formProfil').onsubmit = e => {
        e.preventDefault();
        const nama = $('#pNama').value.trim(), email = $('#pEmail').value.trim().toLowerCase();
        if (!nama) return toast('Nama wajib diisi.', true);
        if (DB.users.some(u => u.email === email && u.user_id !== uid)) return toast('Email sudah dipakai akun lain.', true);
        Object.assign(user, { nama, email });
        commit(); renderLayout(user, 'akun'); toast('Profil diperbarui.');
    };
    $('#formPassword').onsubmit = e => {
        e.preventDefault();
        if ($('#pwLama').value !== user.password) return toast('Kata sandi lama salah.', true);
        if ($('#pwBaru').value.length < 8) return toast('Kata sandi baru minimal 8 karakter.', true);
        user.password = $('#pwBaru').value;
        commit(); e.target.reset(); toast('Kata sandi diganti.');
    };

    if (user.role !== 'mahasiswa') { $('#boxHubung').classList.add('hidden'); return; }
    function renderHubung() {
        $('#kodeHubung').textContent = user.kode_hubung;
        const ortu = DB.parent_links.filter(l => l.student_id === uid).map(l => ({ link: l, u: DB.users.find(x => x.user_id === l.parent_id) }));
        $('#ortuList').innerHTML = ortu.map(o => `
            <div class="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-2">
              <span class="text-xs"><b>${esc(o.u.nama)}</b> · ${esc(o.u.email)}</span>
              <button data-putus="${o.link.link_id}" class="text-xs font-bold text-hsRed">Cabut akses</button>
            </div>`).join('');
        $$('[data-putus]').forEach(b => b.onclick = () => {
            if (!confirm('Cabut akses orang tua ini?')) return;
            DB.parent_links = DB.parent_links.filter(l => !(l.link_id === Number(b.dataset.putus) && l.student_id === uid));
            commit(); renderHubung(); toast('Akses orang tua dicabut.');
        });
    }
    $('#btnKodeBaru').onclick = () => { user.kode_hubung = makeCode(); commit(); renderHubung(); toast('Kode baru dibuat. Kode lama tidak berlaku lagi.'); };
    renderHubung();
};

/* ---------- DASHBOARD ORANG TUA ---------- */
pages.ortu = function (user) {
    const pid = user.user_id;
    let selected = null;

    function render() {
        const anakList = DB.parent_links.filter(l => l.parent_id === pid).map(l => DB.users.find(u => u.user_id === l.student_id)).filter(Boolean);
        if (!anakList.some(a => a.user_id === selected)) selected = anakList[0]?.user_id ?? null;

        $('#anakTabs').innerHTML = anakList.map(a => `
            <button data-anak="${a.user_id}" class="nav-tab ${a.user_id === selected ? 'active' : 'bg-white'} px-4 py-2 text-xs">${esc(a.nama)}</button>`).join('');
        $$('[data-anak]').forEach(b => b.onclick = () => { selected = Number(b.dataset.anak); render(); });

        $('#kosong').classList.toggle('hidden', !!selected);
        $('#isiAnak').classList.toggle('hidden', !selected);
        if (!selected) return;

        const f = forecast(selected), r = reportData(selected, thisMonth());
        $('#warning').innerHTML = warningHTML(f);
        $('#oSaldo').textContent = rupiah(f.saldo);
        $('#oBurn').textContent = rupiah(f.burn);
        $('#oMasuk').textContent = rupiah(r.masuk);
        $('#oKeluar').textContent = rupiah(r.keluar);
        $('#report').innerHTML = reportHTML(r, 'chartOrtu');
        drawReportChart(r, 'chartOrtu');
        const recent = txOf(selected).filter(t => t.jenis !== 'transfer')
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.transaction_id - a.transaction_id).slice(0, 8);
        $('#recentList').innerHTML = recent.length ? recent.map(t => txRowHTML(t, false)).join('') : '<p class="text-xs text-slate-500">Belum ada transaksi.</p>';
    }

    $('#formHubung').onsubmit = e => {
        e.preventDefault();
        const kode = $('#kode').value.trim().toUpperCase();
        const anak = DB.users.find(u => u.role === 'mahasiswa' && u.kode_hubung === kode);
        if (!anak) return toast('Kode tidak ditemukan. Minta kode terbaru di menu Akun milik mahasiswa.', true);
        if (!DB.parent_links.some(l => l.parent_id === pid && l.student_id === anak.user_id))
            DB.parent_links.push({ link_id: nextId('parent_links'), parent_id: pid, student_id: anak.user_id });
        selected = anak.user_id;
        commit(); e.target.reset(); render(); toast('Terhubung dengan ' + anak.nama + '.');
    };
    render();
};

/* ---------------- jalankan halaman sesuai <body data-page="..."> ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'login') return pages.login();
    const roleFor = { ortu: 'orangtua', akun: null };
    const user = requireLogin(page in roleFor ? roleFor[page] : 'mahasiswa');
    if (!user) return;
    const active = page === 'wallet' ? 'dashboard' : page;
    renderLayout(user, active);
    pages[page](user);
});
