/* ForeCash Assistant: chatbot berbasis aturan yang bisa digeser. */


function jawabBot(user, teks) {
    const q = teks.toLowerCase(), uid = user.user_id, f = forecast(uid);
    const ada = (...k) => k.some(w => q.includes(w));

    if (ada('saldo', 'uang aku', 'uangku', 'duit') && !ada('habis', 'kapan', 'cukup')) {
        const w = walletsWithBalance(uid).map(x => `• ${esc(x.nama)}: ${rupiah(x.saldo)}`).join('<br>');
        return `Total saldomu <b>${rupiah(f.saldo)}</b>.<br>${w}`;
    }
    if (ada('habis', 'kapan', 'runway', 'cukup', 'aman')) {
        if (f.burn <= 0) return 'Belum ada pengeluaran yang tercatat, jadi tanggal saldo habis belum bisa diprediksi.';
        let s = `Dengan pengeluaran rata-rata <b>${rupiah(f.burn)}/hari</b>, saldomu diperkirakan habis <b>${tgl(f.habis)}</b> (${f.runway} hari lagi).`;
        if (f.next) s += ` Pemasukan berikutnya ${tgl(f.next.tanggal_perkiraan)}, jadi statusmu <b>${f.status.toUpperCase()}</b>.`;
        if (f.status !== 'aman' && f.batasAman) s += ` Supaya aman, batasi pengeluaran maksimal <b>${rupiah(f.batasAman)}/hari</b>.`;
        return s;
    }
    if (ada('hemat', 'tips', 'saran', 'boros', 'kategori', 'paling banyak')) {
        const r = reportData(uid, thisMonth());
        if (!r.perKategori.length) return 'Belum ada pengeluaran bulan ini. Mulai catat dulu, nanti aku kasih saran berdasarkan datamu.';
        const top = r.perKategori[0], pct = Math.round(top.total / r.keluar * 100);
        const tips = {
            'Makan & Minum': 'Coba bawa bekal 2–3 kali seminggu atau batasi jajan kopi.',
            'Transportasi': 'Gabungkan perjalanan atau pakai transportasi umum untuk rute rutin.',
            'Hiburan': 'Tentukan jatah hiburan per minggu dan catat setiap kali dipakai.',
            'Kos / Sewa': 'Ini biaya tetap, jadi fokuskan penghematan di kategori lain.'
        }[top.kategori] || 'Coba tetapkan batas khusus untuk kategori ini setiap minggu.';
        return `Bulan ini pengeluaran terbesarmu di <b>${esc(top.kategori)}</b>: ${rupiah(top.total)} (${pct}% dari total). ${tips}`;
    }
    if (ada('burn', 'rata-rata', 'per hari', 'harian')) {
        return `Burn rate-mu <b>${rupiah(f.burn)}/hari</b>, dihitung dari total pengeluaran ${f.hari} hari terakhir dibagi ${f.hari}. Transfer antar wallet tidak ikut dihitung.`;
    }
    if (ada('utang', 'piutang', 'pinjam', 'nagih', 'patungan')) {
        const b = DB.debts.filter(d => d.user_id === uid && d.status === 'belum');
        const pi = b.filter(d => d.arah === 'piutang'), ut = b.filter(d => d.arah === 'utang');
        if (!b.length) return 'Tidak ada utang atau piutang yang belum lunas. Mantap!';
        return `Piutang (teman ke kamu): <b>${rupiah(pi.reduce((s, d) => s + d.nominal, 0))}</b> dari ${pi.length} orang.<br>Utang (kamu ke teman): <b>${rupiah(ut.reduce((s, d) => s + d.nominal, 0))}</b> ke ${ut.length} orang.<br>Kirim pengingat lewat menu <a href="utang.html" class="underline font-bold">Utang & Patungan</a>.`;
    }
    if (ada('badge', 'level', 'poin', 'streak', 'pencapaian')) {
        const g = gamify(user);
        return `Kamu di <b>Level ${g.level} · ${g.levelNama}</b> (${g.poin} poin), streak <b>${g.streak} hari</b>, dan sudah dapat ${g.badges.filter(b => b.dapat).length} dari ${g.badges.length} badge. Lihat detail di <a href="pencapaian.html" class="underline font-bold">Pencapaian</a>.`;
    }
    if (ada('transfer', 'wallet', 'dompet', 'gopay', 'bca', 'e-wallet')) {
        return 'Untuk isi e-wallet dari rekening, catat sebagai <b>Transfer</b> di menu Transaksi. Cukup sekali catat, dan tidak dihitung sebagai pengeluaran sehingga burn rate tetap akurat.';
    }
    if (ada('catat', 'tambah', 'input', 'cara')) {
        return 'Buka menu <a href="transaksi.html#form" class="underline font-bold">Transaksi</a>, pilih jenis, isi nominal, kategori, dan tanggal, lalu Simpan. Wallet boleh dikosongkan, otomatis masuk ke "Utama".';
    }
    if (ada('halo', 'hai', 'hi', 'pagi', 'siang', 'malam')) return `Halo ${esc(user.nama.split(' ')[0])}! Mau cek saldo, kapan uang habis, atau minta tips hemat?`;
    return 'Maaf, aku belum paham pertanyaan itu. Coba tanya soal <b>saldo</b>, <b>kapan uang habis</b>, <b>tips hemat</b>, <b>utang</b>, atau <b>pencapaian</b>.';
}

function initChatbot(user) {
    if (user.role !== 'mahasiswa' || $('#fcBot')) return;
    const logo = `<img src="../assets/img/logo.svg" alt="" class="w-9 h-9 shrink-0 drop-shadow">`;
    const wrap = document.createElement('div');
    wrap.id = 'fcBot';
    wrap.innerHTML = `
      <button id="fcBotBtn" aria-label="Buka ForeCash Assistant" title="ForeCash Assistant (bisa digeser)"
        class="fixed z-[90] w-16 h-16 flex items-center justify-center cursor-grab touch-none select-none bg-transparent">
        <img src="../assets/img/logo.svg" alt="" class="fc-bot-logo w-14 h-14 pointer-events-none" draggable="false">
      </button>
      <div id="fcBotPanel" class="hidden fixed z-[91] w-[22rem] max-w-[calc(100vw-1.5rem)] hs-card flex flex-col overflow-hidden" style="height:28rem">
        <div class="flex items-center gap-3 px-4 py-3 bg-hsYellow">
          ${logo}
          <div class="flex-1"><p class="font-black text-sm">ForeCash Assistant</p><p class="text-[10px] font-bold text-hsDark/70">Menjawab dari data keuanganmu</p></div>
          <button id="fcBotClose" class="w-8 h-8 rounded-full bg-white/70 font-bold" aria-label="Tutup">×</button>
        </div>
        <div id="fcBotMsgs" class="flex-1 overflow-y-auto p-3 space-y-2 text-xs"></div>
        <div id="fcBotChips" class="flex flex-wrap gap-1.5 px-3 pb-2"></div>
        <form id="fcBotForm" class="flex gap-2 p-3 border-t">
          <input id="fcBotInput" autocomplete="off" placeholder="Tanya sesuatu..." aria-label="Pertanyaan" class="flex-1 px-3 py-2 text-xs border">
          <button class="hs-btn bg-hsOrange text-white px-4 text-xs">Kirim</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    const btn = $('#fcBotBtn'), panel = $('#fcBotPanel'), msgs = $('#fcBotMsgs');
    const POS_KEY = 'forecash_bot_pos';
    let pos = { x: window.innerWidth - 88, y: window.innerHeight - 96 };
    try { pos = JSON.parse(localStorage.getItem(POS_KEY)) || pos; } catch (e) { /* abaikan */ }

    function clamp() {
        pos.x = Math.min(Math.max(8, pos.x), window.innerWidth - 72);
        pos.y = Math.min(Math.max(8, pos.y), window.innerHeight - 72);
        btn.style.left = pos.x + 'px'; btn.style.top = pos.y + 'px';
        // panel dibuka di sisi yang masih muat di layar
        const pw = panel.offsetWidth || 352, ph = panel.offsetHeight || 448;
        panel.style.left = Math.min(Math.max(12, pos.x + 64 - pw), window.innerWidth - pw - 12) + 'px';
        panel.style.top = (pos.y - ph - 12 > 12 ? pos.y - ph - 12 : Math.min(pos.y + 76, window.innerHeight - ph - 12)) + 'px';
    }
    clamp();
    window.addEventListener('resize', clamp);

    // geser dengan mouse / jari; klik tanpa geser = buka/tutup
    let drag = null;
    btn.addEventListener('pointerdown', e => { drag = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false }; btn.setPointerCapture(e.pointerId); btn.style.cursor = 'grabbing'; });
    btn.addEventListener('pointermove', e => {
        if (!drag) return;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
        if (drag.moved) { pos.x = drag.ox + dx; pos.y = drag.oy + dy; clamp(); }
    });
    btn.addEventListener('pointerup', () => {
        if (!drag) return;
        btn.style.cursor = 'grab';
        if (drag.moved) { try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) { /* abaikan */ } }
        else toggle();
        drag = null;
    });

    function bubble(html, dariUser) {
        msgs.insertAdjacentHTML('beforeend', dariUser
            ? `<div class="flex justify-end"><div class="bg-hsOrange text-white rounded-2xl rounded-br-md px-3 py-2 max-w-[80%]">${esc(html)}</div></div>`
            : `<div class="flex gap-2 items-end">${logo.replace('w-9 h-9', 'w-7 h-7')}<div class="bg-slate-100 rounded-2xl rounded-bl-md px-3 py-2 max-w-[80%] leading-relaxed">${html}</div></div>`);
        msgs.scrollTop = msgs.scrollHeight;
    }
    function tanya(teks) {
        if (!teks.trim()) return;
        bubble(teks, true);
        setTimeout(() => bubble(jawabBot(currentUser() || user, teks)), 350);
    }
    function toggle() {
        panel.classList.toggle('hidden');
        clamp();
        if (!panel.classList.contains('hidden')) {
            if (!msgs.children.length) bubble(`Halo ${esc(user.nama.split(' ')[0])}! Aku ForeCash Assistant. Mau tanya apa soal keuanganmu?`);
            $('#fcBotInput').focus();
        }
    }
    $('#fcBotClose').onclick = toggle;
    $('#fcBotChips').innerHTML = ['Kapan uangku habis?', 'Tips hemat', 'Cek saldo', 'Utang & piutang', 'Level aku'].map(c =>
        `<button type="button" class="bg-slate-100 hover:bg-hsYellow rounded-full px-2.5 py-1 text-[11px] font-bold">${c}</button>`).join('');
    $$('#fcBotChips button').forEach(b => b.onclick = () => tanya(b.textContent));
    $('#fcBotForm').onsubmit = e => { e.preventDefault(); const i = $('#fcBotInput'); tanya(i.value); i.value = ''; };
}
