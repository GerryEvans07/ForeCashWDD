/* Halaman Akun, avatar, kode hubung, FAQ. */

/* ---------- AKUN ---------- */
pages.akun = function (user) {
    const uid = user.user_id;
    $('#pNama').value = user.nama;
    $('#pEmail').value = user.email;
    $('#pRole').textContent = user.role === 'orangtua' ? 'Orang Tua' : 'Mahasiswa';
    $('#avatarPicker').innerHTML = avatarPickerHTML(user.avatar || 'a1');

    $('#formProfil').onsubmit = e => {
        e.preventDefault();
        const nama = $('#pNama').value.trim(), email = $('#pEmail').value.trim().toLowerCase();
        if (!nama) return toast('Nama wajib diisi.', true);
        if (DB.users.some(u => u.email === email && u.user_id !== uid)) return toast('Email sudah dipakai akun lain.', true);
        Object.assign(user, { nama, email, avatar: ($('input[name=avatar]:checked') || {}).value || user.avatar });
        commit(); renderLayout(user, 'akun'); toast('Profil diperbarui.');
    };
    $('#formPassword').onsubmit = e => {
        e.preventDefault();
        if ($('#pwLama').value !== user.password) return toast('Kata sandi lama salah.', true);
        if ($('#pwBaru').value.length < 8) return toast('Kata sandi baru minimal 8 karakter.', true);
        user.password = $('#pwBaru').value;
        commit(); e.target.reset(); toast('Kata sandi diganti.');
    };

    if (user.role !== 'mahasiswa') { $('#boxHubung').classList.add('hidden'); return; }
    function renderHubung() {
        $('#kodeHubung').textContent = user.kode_hubung;
        const ortu = DB.parent_links.filter(l => l.student_id === uid).map(l => ({ link: l, u: DB.users.find(x => x.user_id === l.parent_id) }));
        $('#ortuList').innerHTML = ortu.map(o => `
            <div class="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-2">
              <span class="text-xs"><b>${esc(o.u.nama)}</b> · ${esc(o.u.email)}</span>
              <button data-putus="${o.link.link_id}" class="text-xs font-bold text-hsRed">Cabut akses</button>
            </div>`).join('');
        $$('[data-putus]').forEach(b => b.onclick = () => {
            if (!confirm('Cabut akses orang tua ini?')) return;
            DB.parent_links = DB.parent_links.filter(l => !(l.link_id === Number(b.dataset.putus) && l.student_id === uid));
            commit(); renderHubung(); toast('Akses orang tua dicabut.');
        });
    }
    $('#btnKodeBaru').onclick = () => { user.kode_hubung = makeCode(); commit(); renderHubung(); toast('Kode baru dibuat. Kode lama tidak berlaku lagi.'); };
    renderHubung();
};
