/* Halaman Pantau Anak (peran orang tua). */

/* ---------- DASHBOARD ORANG TUA ---------- */
pages.ortu = function (user) {
    const pid = user.user_id;
    let selected = null;

    function render() {
        const anakList = DB.parent_links.filter(l => l.parent_id === pid).map(l => DB.users.find(u => u.user_id === l.student_id)).filter(Boolean);
        if (!anakList.some(a => a.user_id === selected)) selected = anakList[0]?.user_id ?? null;

        $('#anakTabs').innerHTML = anakList.map(a => `
            <button data-anak="${a.user_id}" class="nav-tab ${a.user_id === selected ? 'active' : 'bg-white'} px-4 py-2 text-xs">${esc(a.nama)}</button>`).join('');
        $$('[data-anak]').forEach(b => b.onclick = () => { selected = Number(b.dataset.anak); render(); });

        $('#kosong').classList.toggle('hidden', !!selected);
        $('#isiAnak').classList.toggle('hidden', !selected);
        if (!selected) return;

        const f = forecast(selected), r = reportData(selected, thisMonth());
        $('#warning').innerHTML = warningHTML(f, DB.users.find(u => u.user_id === selected).avatar);
        $('#oSaldo').textContent = rupiah(f.saldo);
        $('#oBurn').textContent = rupiah(f.burn);
        $('#oMasuk').textContent = rupiah(r.masuk);
        $('#oKeluar').textContent = rupiah(r.keluar);
        $('#report').innerHTML = reportHTML(r, 'chartOrtu');
        drawReportChart(r, 'chartOrtu');
        const recent = txOf(selected).filter(t => t.jenis !== 'transfer')
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.transaction_id - a.transaction_id).slice(0, 8);
        $('#recentList').innerHTML = recent.length ? recent.map(t => txRowHTML(t, false)).join('') : '<p class="text-xs text-slate-500">Belum ada transaksi.</p>';
    }

    $('#formHubung').onsubmit = e => {
        e.preventDefault();
        const kode = $('#kode').value.trim().toUpperCase();
        const anak = DB.users.find(u => u.role === 'mahasiswa' && u.kode_hubung === kode);
        if (!anak) return toast('Kode tidak ditemukan. Minta kode terbaru di menu Akun milik mahasiswa.', true);
        if (!DB.parent_links.some(l => l.parent_id === pid && l.student_id === anak.user_id))
            DB.parent_links.push({ link_id: nextId('parent_links'), parent_id: pid, student_id: anak.user_id });
        selected = anak.user_id;
        commit(); e.target.reset(); render(); toast('Terhubung dengan ' + anak.nama + '.');
    };
    render();
};
