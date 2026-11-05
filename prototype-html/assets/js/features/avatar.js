/* Avatar karakter SVG dan ekspresinya. */

const AVATARS = {
    a1: { nama: 'Koko', kulit: '#F2C9A0', rambut: '#6B4226', gaya: 'bob',    baju: '#5B8DEF', ekstra: ['freckles'] },
    a2: { nama: 'Rara', kulit: '#FFD9C2', rambut: '#E8590C', gaya: 'bun',    baju: '#43B883', ekstra: [] },
    a3: { nama: 'Bima', kulit: '#8D5A3B', rambut: '#2B1B14', gaya: 'curly',  baju: '#FFC83D', ekstra: [] },
    a4: { nama: 'Lili', kulit: '#F6D2B8', rambut: '#1F2937', gaya: 'swoop',  baju: '#8B6FE8', ekstra: ['bow'] },
    a5: { nama: 'Dodo', kulit: '#C68B59', rambut: '#3B2F2F', gaya: 'spiky',  baju: '#FF7043', ekstra: ['glasses'] },
    a6: { nama: 'Nana', kulit: '#BFD7FF', rambut: '#3056D3', gaya: 'beanie', baju: '#E96868', ekstra: [] }
};

// mood: 'happy' (aman) | 'neutral' (waspada) | 'worried' (kritis)
function avatarSVG(id, mood = 'happy', size = 64) {
    const a = AVATARS[id] || AVATARS.a1, ink = '#292929';
    const rambutBelakang = {
        bob: `<rect x="12" y="16" width="76" height="62" rx="24" fill="${a.rambut}"/>`,
        bun: `<circle cx="50" cy="12" r="11" fill="${a.rambut}"/>`,
        swoop: `<rect x="14" y="18" width="72" height="54" rx="22" fill="${a.rambut}"/>`,
        curly: '', spiky: '', beanie: ''
    }[a.gaya];
    const rambutDepan = {
        bob: `<path d="M18 42 C18 22 32 16 50 16 C68 16 82 22 82 42 C74 34 62 32 50 33 C38 32 26 34 18 42 Z" fill="${a.rambut}"/>`,
        bun: `<path d="M18 40 C18 22 32 18 50 18 C68 18 82 22 82 40 C70 32 30 32 18 40 Z" fill="${a.rambut}"/>`,
        swoop: `<path d="M18 46 C16 22 34 14 52 15 C70 16 84 24 82 40 C70 30 52 28 40 34 C30 38 24 42 18 46 Z" fill="${a.rambut}"/>`,
        curly: [22, 33, 44, 56, 67, 78].map(x => `<circle cx="${x}" cy="26" r="9" fill="${a.rambut}"/>`).join('')
               + [28, 40, 52, 64, 74].map(x => `<circle cx="${x}" cy="18" r="9" fill="${a.rambut}"/>`).join(''),
        spiky: `<polygon points="18,42 19,18 30,26 36,10 46,23 54,8 62,23 70,12 74,26 82,18 82,42 70,32 50,30 30,32" fill="${a.rambut}"/>`,
        beanie: `<rect x="14" y="12" width="72" height="26" rx="13" fill="${a.rambut}"/><rect x="14" y="31" width="72" height="8" rx="4" fill="#1E3A8A"/><circle cx="50" cy="10" r="6" fill="#FFC83D"/>`
    }[a.gaya];

    const alis = {
        happy:   `<path d="M31 41 L44 41 M56 41 L69 41" />`,
        neutral: `<path d="M31 42 L44 41 M56 41 L69 42" />`,
        worried: `<path d="M31 43 L44 38 M56 38 L69 43" />`
    }[mood];
    const mulut = {
        happy:   `<path d="M43 69 Q50 77 57 69" fill="none"/>`,
        neutral: `<path d="M45 72 L55 72"/>`,
        worried: `<path d="M44 74 Q50 68 56 74" fill="none"/>`
    }[mood];
    const ekstra = a.ekstra.map(e => ({
        freckles: [30, 34, 66, 70].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 64 : 62}" r="1.3" fill="#A0522D"/>`).join(''),
        glasses: `<g fill="none" stroke="${ink}" stroke-width="2.5"><circle cx="38" cy="54" r="12"/><circle cx="62" cy="54" r="12"/><path d="M50 54 L50 54"/><path d="M47 53 Q50 50 53 53"/></g>`,
        bow: `<g fill="#F472B6"><polygon points="70,20 80,14 80,26"/><polygon points="90,20 80,14 80,26"/><circle cx="80" cy="20" r="3"/></g>`
    }[e])).join('');

    return `<svg viewBox="0 0 100 108" width="${size}" height="${size * 1.08}" role="img" aria-label="Avatar ${a.nama}">
      ${rambutBelakang}
      <rect x="40" y="80" width="20" height="10" fill="${a.kulit}"/>
      <rect x="24" y="86" width="52" height="22" rx="10" fill="${a.baju}"/>
      <rect x="18" y="22" width="64" height="64" rx="20" fill="${a.kulit}"/>
      <circle cx="17" cy="56" r="6" fill="${a.kulit}"/><circle cx="83" cy="56" r="6" fill="${a.kulit}"/>
      ${rambutDepan}
      <g stroke="${ink}" stroke-width="3.5" stroke-linecap="round">${alis}</g>
      <circle cx="38" cy="54" r="9" fill="#fff"/><circle cx="62" cy="54" r="9" fill="#fff"/>
      <circle cx="${mood === 'worried' ? 38 : 39}" cy="${mood === 'worried' ? 52 : 55}" r="4.5" fill="${ink}" class="hs-eye"/>
      <circle cx="${mood === 'worried' ? 62 : 63}" cy="${mood === 'worried' ? 52 : 55}" r="4.5" fill="${ink}" class="hs-eye"/>
      <ellipse cx="29" cy="68" rx="6" ry="3.5" fill="#F472B6" opacity=".4"/><ellipse cx="71" cy="68" rx="6" ry="3.5" fill="#F472B6" opacity=".4"/>
      <g stroke="${ink}" stroke-width="3" stroke-linecap="round">${mulut}</g>
      ${ekstra}
    </svg>`;
}

function avatarPickerHTML(selected) {
    return Object.entries(AVATARS).map(([id, a]) => `
      <label class="cursor-pointer text-center">
        <input type="radio" name="avatar" value="${id}" class="peer sr-only" ${id === selected ? 'checked' : ''}>
        <span class="block rounded-2xl bg-slate-50 border-2 border-transparent peer-checked:border-hsOrange peer-checked:bg-orange-50 p-1.5 transition-all">
          ${avatarSVG(id, 'happy', 52)}
        </span>
        <span class="text-[10px] font-bold text-slate-500">${a.nama}</span>
      </label>`).join('');
}
