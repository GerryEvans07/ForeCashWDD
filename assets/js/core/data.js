/* Query data: saldo wallet, kategori, transaksi, dan data laporan. */

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
