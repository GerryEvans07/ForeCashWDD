/* Halaman Utang, piutang, split bill. */

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
        if (!yakinNominal(total)) return;
        const per = Math.round(total / (teman.length + ($('#sbSaya').checked ? 1 : 0)));
        teman.forEach(n => DB.debts.push({ debt_id: nextId('debts'), user_id: uid, nama_teman: n, keterangan: judul, nominal: per, arah: 'piutang', status: 'belum', jatuh_tempo: $('#sbTempo').value || null }));
        commit(); e.target.reset(); sbPreview(); render(); toast(`Split bill dibuat: ${rupiah(per)} per orang.`);
    };

    $('#formDebt').onsubmit = e => {
        e.preventDefault();
        const nama = $('#dNama').value.trim(), ket = $('#dKet').value.trim(), nom = Number($('#dNominal').value);
        if (!nama || !ket || !(nom > 0)) return toast('Nama teman, keterangan, dan nominal wajib diisi.', true);
        if (!yakinNominal(nom)) return;
        DB.debts.push({ debt_id: nextId('debts'), user_id: uid, nama_teman: nama, keterangan: ket, nominal: nom, arah: $('#dArah').value, status: 'belum', jatuh_tempo: $('#dTempo').value || null });
        commit(); e.target.reset(); render(); toast('Catatan disimpan.');
    };
    render();
};
