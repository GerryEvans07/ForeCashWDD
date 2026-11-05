/* Halaman Prediksi, simulasi, jadwal pemasukan. */

/* ---------- PREDIKSI & NOTIFIKASI ---------- */
pages.prediksi = function (user) {
    const uid = user.user_id;
    let f;

    function render() {
        f = forecast(uid);
        $('#warning').innerHTML = warningHTML(f, user.avatar);
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
        if (!yakinNominal(nominal)) return;
        DB.income_schedules.push({ schedule_id: nextId('income_schedules'), user_id: uid, sumber, nominal, tanggal_perkiraan: tanggal, status: 'menunggu' });
        commit(); e.target.reset(); render(); toast('Jadwal pemasukan ditambahkan.');
    };
    render();
};
