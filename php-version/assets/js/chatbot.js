/* ForeCash Assistant: tampilan chatbot yang bisa digeser.
   Pertanyaan dikirim ke api/chatbot.php, yang menjawab berdasarkan data di database. */

function initChatbot(user) {
    if ($('#fcBot')) return;
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
        // di HP, jangan menutupi tab bar bawah
        const bawah = window.innerWidth < 1024 ? 100 : 0;
        pos.y = Math.min(Math.max(8, pos.y), window.innerHeight - 72 - bawah);
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
        const data = new FormData();
        data.append('pesan', teks);
        data.append('csrf', user.csrf);
        fetch('../api/chatbot.php', { method: 'POST', body: data })
            .then(r => r.json())
            .then(j => bubble(j.jawaban || esc(j.error || 'Terjadi kesalahan.')))
            .catch(() => bubble('Maaf, aku tidak bisa terhubung ke server. Coba lagi sebentar.'));
    }
    function toggle() {
        panel.classList.toggle('hidden');
        clamp();
        if (!panel.classList.contains('hidden')) {
            if (!msgs.children.length) bubble(`Halo ${esc(user.nama)}! Aku ForeCash Assistant. Mau tanya apa soal keuanganmu?`);
            $('#fcBotInput').focus();
        }
    }
    $('#fcBotClose').onclick = toggle;
    $('#fcBotChips').innerHTML = ['Kapan uangku habis?', 'Tips hemat', 'Cek saldo', 'Utang & piutang', 'Level aku'].map(c =>
        `<button type="button" class="bg-slate-100 hover:bg-hsYellow rounded-full px-2.5 py-1 text-[11px] font-bold">${c}</button>`).join('');
    $$('#fcBotChips button').forEach(b => b.onclick = () => tanya(b.textContent));
    $('#fcBotForm').onsubmit = e => { e.preventDefault(); const i = $('#fcBotInput'); tanya(i.value); i.value = ''; };
}

document.addEventListener('DOMContentLoaded', () => { if (window.FC_USER) initChatbot(window.FC_USER); });
