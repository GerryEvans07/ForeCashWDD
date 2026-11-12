/* Script kecil untuk semua halaman. Data dan perhitungan ada di PHP;
   di sini hanya bantuan tampilan: konfirmasi nominal besar dan pratinjau split bill. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function rupiah(n) { return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }

// Nominal di atas Rp5.000.000 perlu dikonfirmasi supaya salah ketik (kelebihan nol) tidak langsung tersimpan.
const BATAS_KONFIRMASI = 5000000;
document.addEventListener('submit', e => {
    const input = e.target.querySelector('input[name=nominal], input[name=total], input[name=saldo_awal]');
    const n = input ? Number(input.value) : 0;
    if (n >= BATAS_KONFIRMASI && !confirm(`Yakin nominalnya ${rupiah(n)}?\n\nPeriksa lagi jumlah angka nol sebelum menyimpan.`)) {
        e.preventDefault();
        input.focus();
    }
});

// Pratinjau split bill di halaman Utang & Patungan
document.addEventListener('DOMContentLoaded', () => {
    const total = $('#st'), teman = $('#sn'), saya = $('input[name=termasuk_saya]'), out = $('#sbPreview');
    if (!total || !teman || !out) return;
    const update = () => {
        const nama = teman.value.split(',').map(s => s.trim()).filter(Boolean);
        const orang = nama.length + (saya && saya.checked ? 1 : 0);
        out.textContent = Number(total.value) > 0 && nama.length
            ? `${rupiah(Number(total.value) / orang)} per orang · ${nama.length} piutang akan dicatat`
            : '';
    };
    [total, teman, saya].forEach(el => el && el.addEventListener('input', update));
    update();
});
