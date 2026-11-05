/* Inti ForeCash: burn rate, runway, tanggal habis, dan status peringatan dini. */

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
