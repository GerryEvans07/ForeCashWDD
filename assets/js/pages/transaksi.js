/* Halaman Transaksi, kategori, batas harian. */

/* ---------- TRANSAKSI ---------- */
pages.transaksi = function (user) {
    const uid = user.user_id;
    let editingId = null;
    const form = $('#txForm');

    function fillSelects() {
        form.wallet_id.innerHTML = walletOptions(uid, true);
        form.wallet_tujuan_id.innerHTML = walletOptions(uid, false);
        form.category_id.innerHTML = categoriesFor(uid).map(c => `<option value="${c.category_id}" data-jenis="${c.jenis}">${esc(c.nama)}</option>`).join('');
    }
    function syncJenis() {
        const j = form.jenis.value, transfer = j === 'transfer';
        $('#boxKategori').classList.toggle('hidden', transfer);
        $('#boxTujuan').classList.toggle('hidden', !transfer);
        $('#lblWallet').textContent = transfer ? 'Dari wallet' : 'Wallet';
        const opts = [...form.category_id.options];
        opts.forEach(o => { o.hidden = o.dataset.jenis !== j; });
        if (form.category_id.selectedOptions[0]?.hidden) { const first = opts.find(o => !o.hidden); if (first) first.selected = true; }
    }
    function resetForm() {
        editingId = null; form.reset(); form.tanggal.value = today();
        $('#txFormTitle').textContent = 'Catat Transaksi';
        $('#btnSimpanTx').textContent = 'Simpan Transaksi';
        $('#btnBatalEdit').classList.add('hidden');
        syncJenis();
    }

    function validate() {
        const jenis = form.jenis.value, nominal = Number(form.nominal.value), tanggal = form.tanggal.value;
        const wallet_id = Number(form.wallet_id.value), tujuan = Number(form.wallet_tujuan_id.value);
        let keterangan = form.keterangan.value.trim(), category_id = Number(form.category_id.value);
        if (!(nominal > 0)) return 'Nominal harus lebih dari 0.';
        if (!tanggal) return 'Tanggal wajib diisi.';
        if (tanggal > today()) return 'Tanggal tidak boleh melebihi hari ini.';
        if (jenis === 'transfer') {
            if (tujuan === wallet_id) return 'Wallet asal dan tujuan tidak boleh sama.';
            return { jenis, nominal, tanggal, wallet_id, wallet_tujuan_id: tujuan, category_id: null, keterangan: keterangan || 'Transfer antar wallet' };
        }
        if (!keterangan) return 'Keterangan wajib diisi.';
        return { jenis, nominal, tanggal, wallet_id, wallet_tujuan_id: null, category_id, keterangan };
    }

    form.jenis.onchange = syncJenis;
    $('#btnBatalEdit').onclick = resetForm;
    form.onsubmit = e => {
        e.preventDefault();
        const v = validate();
        if (typeof v === 'string') return toast(v, true);
        if (!yakinNominal(v.nominal)) return;
        if (editingId) {
            Object.assign(DB.transactions.find(t => t.transaction_id === editingId && t.user_id === uid), v);
            toast('Transaksi diperbarui.');
        } else {
            DB.transactions.push({ transaction_id: nextId('transactions'), user_id: uid, ...v });
            toast('Transaksi tersimpan.');
        }
        commit(); fillSelects(); resetForm(); renderList(); renderBatas();
    };

    function renderList() {
        const bulan = $('#filterBulan').value || thisMonth();
        const list = txOf(uid).filter(t => t.tanggal.slice(0, 7) === bulan)
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.transaction_id - a.transaction_id);
        $('#txList').innerHTML = list.length ? list.map(t => txRowHTML(t, true)).join('') : '<p class="text-xs text-slate-500">Belum ada transaksi di bulan ini.</p>';
        $$('[data-hapus]', $('#txList')).forEach(b => b.onclick = () => {
            if (!confirm('Hapus transaksi ini?')) return;
            DB.transactions = DB.transactions.filter(t => !(t.transaction_id === Number(b.dataset.hapus) && t.user_id === uid));
            commit(); fillSelects(); renderList(); renderBatas(); toast('Transaksi dihapus.');
        });
        $$('[data-edit]', $('#txList')).forEach(b => b.onclick = () => {
            const t = DB.transactions.find(x => x.transaction_id === Number(b.dataset.edit) && x.user_id === uid);
            editingId = t.transaction_id;
            form.jenis.value = t.jenis; syncJenis();
            form.nominal.value = t.nominal; form.keterangan.value = t.keterangan; form.tanggal.value = t.tanggal;
            form.wallet_id.value = t.wallet_id;
            if (t.category_id) form.category_id.value = t.category_id;
            if (t.wallet_tujuan_id) form.wallet_tujuan_id.value = t.wallet_tujuan_id;
            $('#txFormTitle').textContent = 'Ubah Transaksi';
            $('#btnSimpanTx').textContent = 'Simpan Perubahan';
            $('#btnBatalEdit').classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        });
    }

    function renderBatas() {
        $('#batasHarian').value = user.batas_harian || 0;
        const hariIni = txOf(uid).filter(t => t.jenis === 'pengeluaran' && t.tanggal === today()).reduce((s, t) => s + t.nominal, 0);
        const el = $('#batasStatus');
        if (user.batas_harian > 0) {
            const lewat = hariIni > user.batas_harian;
            el.className = `text-[11px] font-bold ${lewat ? 'text-hsRed' : 'text-hsGreen'}`;
            el.textContent = `Hari ini: ${rupiah(hariIni)} dari ${rupiah(user.batas_harian)} — ${lewat ? 'melebihi batas!' : 'masih aman.'}`;
        } else el.textContent = '';
    }
    $('#formBatas').onsubmit = e => {
        e.preventDefault();
        user.batas_harian = Math.max(0, Number($('#batasHarian').value) || 0);
        commit(); renderBatas(); toast('Batas harian diperbarui.');
    };

    function renderKategori() {
        const mine = DB.categories.filter(c => c.user_id === uid);
        $('#kategoriChips').innerHTML = mine.length ? mine.map(c => `
            <span class="inline-flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-[11px] font-bold">${esc(c.nama)}
              <button data-hapus-kat="${c.category_id}" class="w-5 h-5 rounded-full hover:bg-white" title="Hapus">×</button></span>`).join('')
            : '<p class="text-xs text-slate-500">Kategori bawaan sudah tersedia. Tambahkan kategori khusus di sini.</p>';
        $$('[data-hapus-kat]').forEach(b => b.onclick = () => {
            const id = Number(b.dataset.hapusKat);
            DB.categories = DB.categories.filter(c => !(c.category_id === id && c.user_id === uid));
            DB.transactions.forEach(t => { if (t.category_id === id) t.category_id = null; });
            commit(); fillSelects(); syncJenis(); renderKategori(); renderList(); toast('Kategori dihapus.');
        });
    }
    $('#formKategori').onsubmit = e => {
        e.preventDefault();
        const nama = $('#namaKategori').value.trim();
        if (!nama) return toast('Nama kategori wajib diisi.', true);
        DB.categories.push({ category_id: nextId('categories'), user_id: uid, nama, jenis: $('#jenisKategori').value });
        commit(); e.target.reset(); fillSelects(); syncJenis(); renderKategori(); toast('Kategori ditambahkan.');
    };

    $('#filterBulan').value = thisMonth();
    $('#filterBulan').onchange = renderList;
    form.tanggal.max = today();
    fillSelects(); resetForm(); renderList(); renderBatas(); renderKategori();
    if (location.hash === '#form') form.nominal.focus();
};
