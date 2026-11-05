/* Halaman Laporan bulanan dan ekspor CSV. */

/* ---------- LAPORAN ---------- */
pages.laporan = function (user) {
    const uid = user.user_id;
    function render() {
        const bulan = $('#filterBulan').value || thisMonth();
        const r = reportData(uid, bulan);
        $('#report').innerHTML = reportHTML(r, 'chartLaporan');
        drawReportChart(r, 'chartLaporan');
    }
    $('#filterBulan').value = thisMonth();
    $('#filterBulan').onchange = render;

    // ekspor CSV (dibuka dengan Excel)
    $('#btnExport').onclick = () => {
        const bulan = $('#filterBulan').value || thisMonth();
        const rows = [['Tanggal', 'Jenis', 'Keterangan', 'Kategori', 'Wallet', 'Ke Wallet', 'Nominal']];
        txOf(uid).filter(t => t.tanggal.slice(0, 7) === bulan).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).forEach(t =>
            rows.push([t.tanggal, t.jenis, t.keterangan, t.category_id ? categoryName(t.category_id) : '-', walletName(t.wallet_id), t.wallet_tujuan_id ? walletName(t.wallet_tujuan_id) : '', t.nominal]));
        const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `forecash-${bulan}.csv`;
        a.click();
    };
    render();
};
