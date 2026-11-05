/* Konstanta dan fungsi bantu umum: format rupiah, tanggal, toast. */

const DB_KEY = 'forecash_db';
const SES_KEY = 'forecash_session';

/* ---------------- helper umum ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function rupiah(n) { return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }

function ymd(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function today() { return ymd(new Date()); }
function addDays(dateStr, n) { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
function diffDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function tgl(dateStr) {
    const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
}
function thisMonth() { return today().slice(0, 7); }

// konfirmasi nominal besar supaya salah ketik (kelebihan nol) tidak langsung tersimpan
const BATAS_KONFIRMASI = 5000000;
function yakinNominal(n) {
    return n < BATAS_KONFIRMASI || confirm(`Yakin nominalnya ${rupiah(n)}?\n\nPeriksa lagi jumlah angka nol sebelum menyimpan.`);
}

function toast(msg, isError = false) {
    let t = $('#toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'fixed bottom-5 right-5 z-[100] max-w-sm px-5 py-3 rounded-full shadow-xl text-sm font-bold text-white';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? '#E96868' : '#292929';
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 2800);
}
