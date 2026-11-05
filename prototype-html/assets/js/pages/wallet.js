/* Halaman Kelola wallet. */

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
        if (!yakinNominal(Number($('#saldoBaru').value) || 0)) return;
        DB.wallets.push({ wallet_id: nextId('wallets'), user_id: uid, nama, tipe: $('#tipeBaru').value, saldo_awal: Math.max(0, Number($('#saldoBaru').value) || 0) });
        commit(); e.target.reset(); render(); toast('Wallet ditambahkan.');
    };
    render();
};
