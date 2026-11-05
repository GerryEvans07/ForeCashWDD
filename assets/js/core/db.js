/* "Database" di localStorage. Struktur tabel sama dengan database.sql. */

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
    db.users.push({ user_id: id('users'), nama: 'Momo Mahasiswa', email: 'demo@forecash.id', password: 'demo12345', role: 'mahasiswa', kode_hubung: 'DEMO2026', batas_harian: 45000, avatar: 'a2' });
    db.users.push({ user_id: id('users'), nama: 'Ibu Momo', email: 'ortu@forecash.id', password: 'demo12345', role: 'orangtua', kode_hubung: null, batas_harian: 0, avatar: 'a4' });
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
