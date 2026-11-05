/* Halaman Pencapaian dan badge. */

/* ---------- halaman pencapaian ---------- */
pages.pencapaian = function (user) {
    const g = gamify(user);
    $('#profilGame').innerHTML = `
      <div class="w-24 h-24 bg-hsYellow/40 rounded-full flex items-end justify-center overflow-hidden shrink-0">${avatarSVG(user.avatar, 'happy', 88)}</div>
      <div class="flex-1 min-w-[200px]">
        <p class="text-xl font-black">${esc(user.nama)}</p>
        <div class="mt-2">${levelBarHTML(g)}</div>
      </div>
      <div class="text-center"><p class="text-4xl">🔥</p><p class="text-xl font-black">${g.streak} hari</p><p class="text-[11px] text-slate-500">streak</p></div>`;
    $('#tantangan').innerHTML = tantanganHTML(g.tantangan);
    $('#badgeGrid').innerHTML = g.badges.map(b => `
      <div class="hs-card p-5 text-center space-y-2 ${b.dapat ? '' : 'opacity-60'}">
        <div class="text-4xl ${b.dapat ? '' : 'grayscale'}">${b.icon}</div>
        <p class="text-sm font-black">${b.nama}</p>
        <p class="text-[11px] text-slate-500">${esc(b.ket)}</p>
        ${b.dapat ? '<span class="inline-block text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">TERCAPAI · +100</span>'
                  : `<div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-hsOrange h-2 rounded-full" style="width:${Math.round(b.now / b.max * 100)}%"></div></div>
                     <p class="text-[10px] font-bold">${b.now}/${b.max}</p>`}
      </div>`).join('');
};
