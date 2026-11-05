/* Halaman Dashboard mahasiswa. */

/* ---------- DASHBOARD ---------- */
pages.dashboard = function (user) {
    const uid = user.user_id, f = forecast(uid);
    const belum = DB.debts.filter(d => d.user_id === uid && d.status === 'belum');
    $('#warning').innerHTML = warningHTML(f, user.avatar);
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
    renderGameStrip(user);
};
