/* Tampilan bersama: header, navigasi, footer, banner peringatan, grafik, baris transaksi. */

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
           ['laporan', 'laporan.html', 'fa-chart-pie', 'Laporan'],
           ['pencapaian', 'pencapaian.html', 'fa-trophy', 'Pencapaian']];

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
                <span class="w-7 h-7 rounded-full bg-hsYellow/40 overflow-hidden flex items-end justify-center">${avatarSVG(user.avatar, 'happy', 28)}</span>
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

function warningHTML(f, avatarId = 'a1') {
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
      <!-- maskot bereaksi: ekspresi avatar mengikuti status keuangan -->
      <div class="shrink-0 flex flex-col items-center gap-2">
        <div class="bg-white rounded-2xl px-3 py-1.5 text-xs font-bold shadow-sm">${{ aman: 'Aman, lanjutkan!', waspada: 'Hati-hati ya...', kritis: 'Gawat, rem dulu!' }[f.status]}</div>
        <div class="w-32 h-32 bg-white/70 rounded-full flex items-end justify-center overflow-hidden border-4 border-white shadow-lg character-bounce">
          ${avatarSVG(avatarId, { aman: 'happy', waspada: 'neutral', kritis: 'worried' }[f.status], 116)}
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
