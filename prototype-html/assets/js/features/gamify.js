/* Gamifikasi: streak, badge, poin, level, tantangan mingguan. */

const LEVELS = [
    [0, 'Pemula'], [200, 'Hemat Muda'], [400, 'Pengatur Cerdas'], [600, 'Master Budget'], [800, 'Legenda ForeCash']
];

// berapa hari berturut-turut pengguna mencatat transaksi (boleh belum mencatat hari ini)
function hitungStreak(uid) {
    const hari = new Set(txOf(uid).map(t => t.tanggal));
    let d = hari.has(today()) ? today() : addDays(today(), -1), n = 0;
    while (hari.has(d)) { n++; d = addDays(d, -1); }
    return n;
}

function senin(dateStr) { const d = new Date(dateStr + 'T00:00:00'); const g = (d.getDay() + 6) % 7; return addDays(dateStr, -g); }

function gamify(user) {
    const uid = user.user_id, tx = txOf(uid), streak = hitungStreak(uid);
    const debts = DB.debts.filter(d => d.user_id === uid);
    const keluarPada = tgl => tx.filter(t => t.jenis === 'pengeluaran' && t.tanggal === tgl).reduce((s, t) => s + t.nominal, 0);

    let hariHemat = 0;
    if (user.batas_harian > 0) for (let i = 0; i < 7; i++) if (keluarPada(addDays(today(), -i)) <= user.batas_harian) hariHemat++;
    const utangAktif = debts.filter(d => d.arah === 'utang' && d.status === 'belum').length;
    const piutangLunas = debts.filter(d => d.arah === 'piutang' && d.status === 'lunas').length;
    const punyaJadwal = DB.income_schedules.some(s => s.user_id === uid);
    const status = forecast(uid).status;

    const badges = [
        { icon: '📝', nama: 'Pencatat Pemula', ket: 'Catat 10 transaksi', now: Math.min(tx.length, 10), max: 10 },
        { icon: '🔥', nama: 'Rajin Mencatat', ket: 'Streak mencatat 7 hari', now: Math.min(streak, 7), max: 7 },
        { icon: '🐷', nama: 'Hemat Seminggu', ket: user.batas_harian > 0 ? '7 hari terakhir di bawah batas harian' : 'Atur batas harian dulu di menu Transaksi', now: hariHemat, max: 7 },
        { icon: '🤝', nama: 'Bebas Utang', ket: 'Tidak punya utang yang belum lunas', now: debts.length && !utangAktif ? 1 : 0, max: 1 },
        { icon: '💸', nama: 'Penagih Andal', ket: 'Lunasi 3 piutang dari teman', now: Math.min(piutangLunas, 3), max: 3 },
        { icon: '📅', nama: 'Perencana', ket: 'Tambahkan jadwal pemasukan', now: punyaJadwal ? 1 : 0, max: 1 },
        { icon: '🛡️', nama: 'Aman Terkendali', ket: 'Status peringatan sedang Aman', now: status === 'aman' ? 1 : 0, max: 1 }
    ].map(b => ({ ...b, dapat: b.now >= b.max }));

    const poin = badges.filter(b => b.dapat).length * 100 + Math.min(streak, 30) * 10;
    let li = 0; LEVELS.forEach(([min], i) => { if (poin >= min) li = i; });
    const next = LEVELS[li + 1];

    // tantangan mingguan: makan & minum < Rp200.000 (Senin–Minggu)
    const awal = senin(today()), batasTantangan = 200000;
    const makan = tx.filter(t => t.jenis === 'pengeluaran' && t.tanggal >= awal && categoryName(t.category_id) === 'Makan & Minum').reduce((s, t) => s + t.nominal, 0);

    return { streak, badges, poin, level: li + 1, levelNama: LEVELS[li][1], nextPoin: next ? next[0] : null, nextNama: next ? next[1] : null,
             prevPoin: LEVELS[li][0], tantangan: { judul: 'Makan & minum minggu ini di bawah ' + rupiah(batasTantangan), now: makan, max: batasTantangan, sisaHari: 6 - diffDays(awal, today()) } };
}

function levelBarHTML(g) {
    const pct = g.nextPoin ? Math.round((g.poin - g.prevPoin) / (g.nextPoin - g.prevPoin) * 100) : 100;
    return `<div class="flex justify-between text-xs font-bold"><span>Level ${g.level} · ${g.levelNama}</span><span>${g.poin} poin</span></div>
      <div class="w-full bg-slate-100 rounded-full h-3 mt-1"><div class="bg-hsPurple h-3 rounded-full" style="width:${pct}%"></div></div>
      <p class="text-[10px] text-slate-500 mt-1">${g.nextPoin ? `${g.nextPoin - g.poin} poin lagi menuju ${g.nextNama}` : 'Level tertinggi tercapai!'}</p>`;
}

function tantanganHTML(t) {
    const pct = Math.min(100, Math.round(t.now / t.max * 100)), lewat = t.now > t.max;
    return `<p class="text-sm font-bold">${t.judul}</p>
      <div class="w-full bg-slate-100 rounded-full h-3 mt-2"><div class="${lewat ? 'bg-hsRed' : 'bg-hsGreen'} h-3 rounded-full" style="width:${pct}%"></div></div>
      <p class="text-[11px] mt-1 ${lewat ? 'text-hsRed font-bold' : 'text-slate-500'}">${rupiah(t.now)} terpakai · ${lewat ? 'tantangan gagal minggu ini' : `sisa ${rupiah(t.max - t.now)}, ${t.sisaHari} hari lagi`}</p>`;
}

/* ---------- strip gamification di dashboard ---------- */
function renderGameStrip(user) {
    const g = gamify(user), dapat = g.badges.filter(b => b.dapat);
    $('#gameStrip').innerHTML = `
      <div class="hs-card p-5 flex items-center gap-4">
        <div class="text-4xl">🔥</div>
        <div><p class="text-2xl font-black">${g.streak} hari</p><p class="text-xs text-slate-500">${g.streak ? 'berturut-turut mencatat' : 'Mulai streak dengan mencatat hari ini'}</p></div>
      </div>
      <div class="hs-card p-5">${levelBarHTML(g)}
        <p class="text-lg mt-1">${dapat.map(b => `<span title="${esc(b.nama)}">${b.icon}</span>`).join(' ') || '<span class="text-xs text-slate-400">Belum ada badge</span>'}</p></div>
      <a href="pencapaian.html" class="hs-card p-5 block">${tantanganHTML(g.tantangan)}
        <p class="text-[11px] font-bold text-hsOrange mt-2">Lihat semua pencapaian →</p></a>`;
}
