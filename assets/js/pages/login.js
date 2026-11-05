/* Halaman Login dan registrasi. */

/* ---------- LOGIN & REGISTRASI ---------- */
pages.login = function () {
    const u = currentUser();
    if (u) { location.href = homeFor(u); return; }
    let mode = 'masuk';
    function setMode(m) {
        mode = m;
        $('#tabMasuk').className = `w-1/2 py-2 text-sm font-bold rounded-xl ${m === 'masuk' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500'}`;
        $('#tabDaftar').className = `w-1/2 py-2 text-sm font-bold rounded-xl ${m === 'daftar' ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500'}`;
        $$('.only-daftar').forEach(el => el.classList.toggle('hidden', m !== 'daftar'));
        $('#nama').required = m === 'daftar';
        $('#btnSubmit').textContent = m === 'daftar' ? 'Buat Akun' : 'Masuk';
        $('#authError').textContent = '';
    }
    $('#tabMasuk').onclick = () => setMode('masuk');
    $('#tabDaftar').onclick = () => setMode('daftar');
    $('#avatarPicker').innerHTML = avatarPickerHTML('a1');
    setMode(location.hash === '#daftar' ? 'daftar' : 'masuk');

    $('#authForm').onsubmit = e => {
        e.preventDefault();
        const email = $('#email').value.trim().toLowerCase(), pass = $('#password').value;
        const err = msg => { $('#authError').textContent = msg; };
        if (mode === 'daftar') {
            const nama = $('#nama').value.trim(), role = $('#role').value;
            if (!nama) return err('Nama wajib diisi.');
            if (pass.length < 8) return err('Kata sandi minimal 8 karakter.');
            if (DB.users.some(x => x.email === email)) return err('Email sudah digunakan.');
            const avatar = ($('input[name=avatar]:checked') || {}).value || 'a1';
            const user = { user_id: nextId('users'), nama, email, password: pass, role, kode_hubung: role === 'mahasiswa' ? makeCode() : null, batas_harian: 0, avatar };
            DB.users.push(user);
            if (role === 'mahasiswa') DB.wallets.push({ wallet_id: nextId('wallets'), user_id: user.user_id, nama: 'Utama', tipe: 'tunai', saldo_awal: 0 });
            commit();
            localStorage.setItem(SES_KEY, user.user_id);
            location.href = homeFor(user);
        } else {
            const user = DB.users.find(x => x.email === email && x.password === pass);
            if (!user) return err('Email atau kata sandi salah.');
            localStorage.setItem(SES_KEY, user.user_id);
            location.href = homeFor(user);
        }
    };
};
