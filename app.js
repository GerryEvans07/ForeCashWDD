// Configuration & State
tailwind.config = {
    theme: {
        extend: {
            colors: {
                hsYellow: '#FFD13B',
                hsOrange: '#FF6B35',
                hsSoftOrange: '#FFA07A',
                hsRed: '#FF4757',
                hsBlue: '#2D8CFF',
                hsSky: '#70B6FF',
                hsPurple: '#8E54E9',
                hsGreen: '#2ECC71',
                hsCream: '#FFFBF0',
                hsDark: '#2C2C2C',
                hsCardBg: '#FFFFFF'
            },
            fontFamily: {
                display: ['Fredoka', 'sans-serif'],
                sans: ['Plus Jakarta Sans', 'sans-serif']
            }
        }
    }
};

let isSignUp = false;
let currentRole = 'student'; // 'student' or 'parent'
let projChart = null;
let reportChart = null;
let selectedSettleDebtId = null;

let categories = JSON.parse(localStorage.getItem('forecash_categories') || 'null') || [
    'Makan & Minum', 'Jajan & Kopi', 'Akademik', 'Hiburan', 'Transportasi', 'Lainnya'
];

let transactions = JSON.parse(localStorage.getItem('forecash_transactions') || 'null') || [
    { id: 1, name: 'Nasi Goreng Kantin', amount: 15000, type: 'expense', category: 'Makan & Minum', wallet: 'Tunai Dompet', date: new Date().toISOString() },
    { id: 2, name: 'Kopi Susu Es', amount: 18000, type: 'expense', category: 'Jajan & Kopi', wallet: 'E-Wallet (Gopay)', date: new Date().toISOString() }
];

let debts = JSON.parse(localStorage.getItem('forecash_debts') || 'null') || [
    { id: 1, name: 'Bima', reason: 'Makbar Seblak', amount: 25000, direction: 'owedToMe' }
];

let wallets = JSON.parse(localStorage.getItem('forecash_wallets') || 'null') || {
    'Bank Keluarga': 350000, 'Tunai Dompet': 85000, 'E-Wallet (Gopay)': 125000, 'Dana Darurat': 180000
};

let campusSuggestions = [
    { title: 'Subsidi UKT KIP-K', desc: 'Pengajuan potongan UKT semester genap dibuka hingga 30 Nov.', icon: '📜' },
    { title: 'Kantin Hemat Kampus', desc: 'Paket nasi + minum Rp 12.000 di Gedung C Kampus.', icon: '🍱' },
    { title: 'Beasiswa Prestasi UMN', desc: 'Dapatkan cashback biaya kuliah untuk IPK > 3.5.', icon: '🏅' }
];

window.onload = function() {
    initCharts();
    checkSession();
    renderCategories();
    renderTransactions();
    renderDebts();
    renderWallets();
    renderCampusSuggestions();
    updateProjection();
    updateReportChart();
};

function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function showToast(message) {
    const t = document.getElementById('toast'); t.textContent = message; t.classList.remove('hidden');
    clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

function persistData() {
    localStorage.setItem('forecash_transactions', JSON.stringify(transactions));
    localStorage.setItem('forecash_debts', JSON.stringify(debts));
    localStorage.setItem('forecash_wallets', JSON.stringify(wallets));
    localStorage.setItem('forecash_categories', JSON.stringify(categories));
}

// Authentication & Role Functions
function toggleAuthRoleFields() {
    currentRole = document.getElementById('authRoleSelect').value;
}

function switchLoginTab(mode) {
    isSignUp = mode === 'signup';
    document.getElementById('btnTabSignUp').className = `w-1/2 py-2 text-xs sm:text-sm font-bold rounded-xl ${isSignUp ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500 hover:text-hsDark'} transition-all`;
    document.getElementById('btnTabSignIn').className = `w-1/2 py-2 text-xs sm:text-sm font-bold rounded-xl ${!isSignUp ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500 hover:text-hsDark'} transition-all`;
    document.getElementById('signUpNameBox').classList.toggle('hidden', !isSignUp);
    document.getElementById('authSubmitButton').innerText = isSignUp ? 'Daftar Akun Baru 🚀' : 'Masuk Ke App 🚀';
}

function handleAuthSubmit(e) { 
    e.preventDefault(); 
    const email = document.getElementById('authEmailInput').value; 
    const name = isSignUp ? document.getElementById('authNameInput').value : email.split('@')[0]; 
    saveAndLogin(name || 'Pengguna', currentRole); 
}

function handleQuickDemoLogin() { saveAndLogin('Budi Mahasiswa', 'student'); }

function saveAndLogin(userName, role = 'student') { 
    const user = { name: userName, role: role }; 
    localStorage.setItem('forecash_hs_user', JSON.stringify(user)); 
    applyUserSession(user); 
}

function checkSession() { 
    const saved = localStorage.getItem('forecash_hs_user'); 
    if(saved) applyUserSession(JSON.parse(saved)); 
}

function applyUserSession(user) { 
    currentRole = user.role || 'student';
    document.getElementById('loginPage').classList.add('hidden'); 
    document.getElementById('mainDashboard').classList.remove('hidden'); 
    document.getElementById('userNameDisplay').innerText = user.name; 
    document.getElementById('profileNameDisplay').innerText = user.name; 
    document.getElementById('userAvatar').innerText = user.name.charAt(0).toUpperCase(); 
    document.getElementById('profileAvatar').innerText = user.name.charAt(0).toUpperCase(); 
    
    document.getElementById('userRoleBadge').innerText = currentRole === 'parent' ? 'Ortu / Wali' : 'Mahasiswa';
    document.getElementById('profileRoleText').innerText = `Role Active: ${currentRole === 'parent' ? 'Orang Tua / Wali' : 'Mahasiswa'}`;

    // Parent Mode UI adjustment
    const parentBanner = document.getElementById('parentModeBanner');
    const studentBtns = document.querySelectorAll('.btn-student-only');

    if (currentRole === 'parent') {
        parentBanner.classList.remove('hidden');
        studentBtns.forEach(btn => btn.classList.add('hidden'));
    } else {
        parentBanner.classList.add('hidden');
        studentBtns.forEach(btn => btn.classList.remove('hidden'));
    }
}

function handleLogout() { 
    localStorage.removeItem('forecash_hs_user'); 
    document.getElementById('mainDashboard').classList.add('hidden'); 
    document.getElementById('loginPage').classList.remove('hidden'); 
}

// Navigation Tabs Function
function switchTab(tabName) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active', 'bg-hsOrange', 'text-white'));
    
    document.getElementById(`page-${tabName}`).classList.remove('hidden'); 
    
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        if (tabName === 'akun') {
            activeBtn.classList.add('bg-hsOrange', 'text-white');
        } else {
            activeBtn.classList.add('active');
        }
    }

    if(tabName === 'prediksi' && projChart) setTimeout(() => projChart.resize(), 100);
    if(tabName === 'laporan' && reportChart) setTimeout(() => { updateReportChart(); reportChart.resize(); }, 100);
    if(tabName === 'transaksi') renderTransactions();
    if(tabName === 'utang') renderDebts();
}

// AI Assistant
function askAIAssistant() {
    const query = document.getElementById('aiQueryInput').value.trim();
    if(!query) return;
    const resBox = document.getElementById('aiResponseBox');
    resBox.classList.remove('hidden');
    resBox.innerHTML = `<strong>AI Response:</strong> Berdasarkan data transaksi Anda, pengeluaran terbesar ada di kategori Jajan. Cobalah beralih ke kantin kampus untuk menghemat hingga Rp 150.000 bulan ini!`;
}

// Campus Suggestions Render
function renderCampusSuggestions() {
    const container = document.getElementById('campusSuggestionsList');
    if(!container) return;
    container.innerHTML = campusSuggestions.map(s => `
        <div class="p-3 bg-white/90 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <div class="space-y-1">
                <span class="text-lg">${s.icon}</span>
                <h5 class="font-bold text-xs text-hsDark">${escapeHTML(s.title)}</h5>
                <p class="text-[11px] text-slate-500 leading-tight">${escapeHTML(s.desc)}</p>
            </div>
        </div>
    `).join('');
}

// Wallet Functions
function openWalletModal(){ const m = document.getElementById('walletModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeWalletModal(){ const m = document.getElementById('walletModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function saveNewWallet(e) {
    e.preventDefault();
    const name = document.getElementById('walletNameInput').value.trim();
    const bal = Number(document.getElementById('walletBalanceInput').value) || 0;
    if(!name) return;

    wallets[name] = bal;
    persistData();
    closeWalletModal();
    e.target.reset();
    renderWallets();
    showToast('Wallet/E-Wallet berhasil ditambahkan!');
}

function renderWallets() {
    const container = document.getElementById('walletCardsGrid');
    if(!container) return;

    const keys = Object.keys(wallets);
    const bgColors = ['bg-blue-50/50', 'bg-orange-50/50', 'bg-purple-50/50', 'bg-emerald-50/50'];
    const textColors = ['text-hsBlue', 'text-hsOrange', 'text-hsPurple', 'text-hsGreen'];

    container.innerHTML = keys.map((k, idx) => {
        const bg = bgColors[idx % bgColors.length];
        const tc = textColors[idx % textColors.length];
        return `
            <div class="hs-card wallet-card p-5 ${bg} space-y-2">
                <div class="flex justify-between items-center text-xs font-extrabold ${tc}">
                    <span><i class="fa-solid fa-wallet"></i> ${escapeHTML(k)}</span>
                </div>
                <p class="text-2xl font-black text-hsDark">${rupiah(wallets[k])}</p>
                <p class="text-[11px] font-semibold text-slate-400">Terhubung Multi-Wallet</p>
            </div>
        `;
    }).join('');

    // Sync options in modals
    const txSelect = document.getElementById('txWallet');
    const settleSelect = document.getElementById('settleWalletSelect');
    if(txSelect) txSelect.innerHTML = keys.map(k => `<option value="${escapeHTML(k)}">${escapeHTML(k)}</option>`).join('');
    if(settleSelect) settleSelect.innerHTML = keys.map(k => `<option value="${escapeHTML(k)}">${escapeHTML(k)}</option>`).join('');
}

// Category Functions
function renderCategories() {
    const chipContainer = document.getElementById('categoryChips');
    const txSelect = document.getElementById('txCategory');
    
    if(chipContainer) {
        chipContainer.innerHTML = categories.map(c => `
            <span class="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">${escapeHTML(c)}</span>
        `).join('');
    }

    if(txSelect) {
        txSelect.innerHTML = categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    }
}

function addNewCategory() {
    const val = document.getElementById('newCategoryInput').value.trim();
    if(!val) return;
    if(!categories.includes(val)) {
        categories.push(val);
        persistData();
        renderCategories();
        document.getElementById('newCategoryInput').value = '';
        showToast(`Kategori "${val}" berhasil ditambahkan!`);
    }
}

// Transactions Functions
function openAddTransactionModal(){ 
    renderCategories();
    renderWallets();
    const m = document.getElementById('transactionModal'); 
    m.classList.remove('hidden'); 
    m.classList.add('flex'); 
}
function closeTransactionModal(){ const m = document.getElementById('transactionModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function saveTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const amount = Number(document.getElementById('txAmount').value);
    const name = document.getElementById('txName').value.trim();
    const category = document.getElementById('txCategory').value;
    const wallet = document.getElementById('txWallet').value;

    if(!amount || !name) return;

    transactions.unshift({ id: Date.now(), name, amount, type, category, wallet, date: new Date().toISOString() });
    wallets[wallet] = Math.max(0, (wallets[wallet] || 0) + (type === 'income' ? amount : -amount));
    
    persistData();
    closeTransactionModal();
    e.target.reset();
    renderTransactions();
    renderWallets();
    updateReportChart();
    showToast('Transaksi berhasil disimpan ✨');
}

function renderTransactions() {
    const container = document.getElementById('transactionListTable');
    if(!container) return;
    if(transactions.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Belum ada transaksi.</p>`;
        return;
    }
    container.innerHTML = transactions.map(t => `
        <div class="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl ${t.type === 'income' ? 'bg-hsGreen/10 text-hsGreen' : 'bg-hsOrange/10 text-hsOrange'} flex items-center justify-center text-base">
                    ${t.type === 'income' ? '💰' : '🧾'}
                </div>
                <div>
                    <h5 class="font-bold text-xs text-hsDark">${escapeHTML(t.name)}</h5>
                    <p class="text-[10px] font-semibold text-slate-400">${escapeHTML(t.wallet)} • ${escapeHTML(t.category)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-black ${t.type === 'income' ? 'text-hsGreen' : 'text-hsRed'} text-xs">${t.type === 'income' ? '+' : '-'} ${rupiah(t.amount)}</span>
                ${currentRole !== 'parent' ? `<button onclick="deleteTransaction(${t.id})" class="text-slate-300 hover:text-hsRed text-xs">×</button>` : ''}
            </div>
        </div>
    `).join('');
}

function deleteTransaction(id) {
    if (currentRole === 'parent') return;
    const t = transactions.find(x => x.id === id);
    if(!t) return;
    wallets[t.wallet] = Math.max(0, (wallets[t.wallet] || 0) + (t.type === 'income' ? -t.amount : t.amount));
    transactions = transactions.filter(x => x.id !== id);
    persistData();
    renderTransactions();
    renderWallets();
    updateReportChart();
    showToast('Transaksi dihapus');
}

function simulateOCR(event) {
    const file = event.target.files && event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('receiptImage').src = e.target.result;
        document.getElementById('receiptPreview').classList.remove('hidden');
        showToast('Struk berhasil dibaca ✨');
    };
    reader.readAsDataURL(file);
}

function updateBudgetLimit(val) {
    showToast(`Batas harian diperbarui: Rp ${Number(val).toLocaleString('id-ID')}`);
}

// Debts & Split Bill Functions
function openDebtModal(){ const m = document.getElementById('debtModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeDebtModal(){ const m = document.getElementById('debtModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function openSplitBillModal(){ const m = document.getElementById('splitBillModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeSplitBillModal(){ const m = document.getElementById('splitBillModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function calculateSplitBill() {
    const total = Number(document.getElementById('sbTotal').value);
    const namesStr = document.getElementById('sbNames').value.trim();
    
    if(!total || !namesStr) {
        showToast('Mohon isi total bill dan nama teman-teman!');
        return;
    }

    const nameList = namesStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if(nameList.length === 0) return;

    const perPerson = Math.ceil(total / (nameList.length + 1)); // Termasuk pengguna sendiri

    // Otomatis tambahkan ke daftar piutang
    nameList.forEach(name => {
        debts.unshift({
            id: Date.now() + Math.random(),
            name: name,
            reason: 'Patungan / Split Bill Auto',
            amount: perPerson,
            direction: 'owedToMe'
        });
    });

    persistData();
    renderDebts();

    document.getElementById('sbResult').classList.remove('hidden');
    document.getElementById('sbPerPersonText').textContent = `${rupiah(perPerson)} / orang (${nameList.length} teman dikreditkan)`;
    showToast('Split bill berhasil dihitung & dicatat ke Utang!');
}

function saveDebt(e) {
    e.preventDefault();
    debts.unshift({
        id: Date.now(),
        name: document.getElementById('debtName').value.trim(),
        reason: document.getElementById('debtReason').value.trim(),
        amount: Number(document.getElementById('debtAmount').value),
        direction: document.getElementById('debtDirection').value
    });
    persistData();
    closeDebtModal();
    e.target.reset();
    renderDebts();
    showToast('Catatan bon berhasil disimpan 🤝');
}

function renderDebts() {
    const grid = document.getElementById('debtCardGrid');
    if(!grid) return;
    grid.innerHTML = debts.map(d => `
        <div class="p-4 rounded-2xl ${d.direction === 'owedToMe' ? 'bg-hsYellow/20 border-hsYellow' : 'bg-hsBlue/10 border-hsBlue/30'} border flex flex-col justify-between space-y-3">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h5 class="font-black text-hsDark text-sm">${escapeHTML(d.name)}</h5>
                    <p class="text-[11px] text-slate-500">${escapeHTML(d.reason)}</p>
                    <span class="text-[9px] font-extrabold ${d.direction === 'owedToMe' ? 'bg-hsGreen' : 'bg-hsBlue'} text-white px-2 py-0.5 rounded-full inline-block mt-1">
                        ${d.direction === 'owedToMe' ? 'Dia Utang Ke Kamu' : 'Kamu Utang Ke Dia'}
                    </span>
                </div>
                <span class="font-black text-hsDark text-sm">${rupiah(d.amount)}</span>
            </div>
            ${currentRole !== 'parent' ? `
            <div class="flex gap-2">
                <button onclick="openSettleDebtModal(${d.id})" class="hs-btn bg-hsGreen text-white text-xs py-1.5 flex-1">Lunas / Selesai</button>
            </div>` : ''}
        </div>
    `).join('');
}

function openSettleDebtModal(id) {
    selectedSettleDebtId = id;
    const debt = debts.find(d => d.id === id);
    if(!debt) return;

    renderWallets();
    const infoText = debt.direction === 'owedToMe' 
        ? `Pelunasan dari ${debt.name} sebesar ${rupiah(debt.amount)} akan dicatat sebagai PEMASUKAN.` 
        : `Pelunasan utang ke ${debt.name} sebesar ${rupiah(debt.amount)} akan dicatat sebagai PENGELUARAN.`;
    
    document.getElementById('settleDebtInfoText').innerText = infoText;
    const m = document.getElementById('settleDebtModal');
    m.classList.remove('hidden');
    m.classList.add('flex');
}

function closeSettleDebtModal() {
    const m = document.getElementById('settleDebtModal');
    m.classList.add('hidden');
    m.classList.remove('flex');
}

function confirmSettleDebt() {
    const debt = debts.find(d => d.id === selectedSettleDebtId);
    if(!debt) return;

    const chosenWallet = document.getElementById('settleWalletSelect').value;
    const type = debt.direction === 'owedToMe' ? 'income' : 'expense';
    const txName = debt.direction === 'owedToMe' ? `Pelunasan Bon: ${debt.name}` : `Bayar Utang: ${debt.name}`;

    // Otomatis Tambah Ke Transaksi
    transactions.unshift({
        id: Date.now(),
        name: txName,
        amount: debt.amount,
        type: type,
        category: 'Lainnya',
        wallet: chosenWallet,
        date: new Date().toISOString()
    });

    // Update Saldo Wallet
    wallets[chosenWallet] = Math.max(0, (wallets[chosenWallet] || 0) + (type === 'income' ? debt.amount : -debt.amount));

    // Hapus dari utang
    debts = debts.filter(d => d.id !== selectedSettleDebtId);

    persistData();
    closeSettleDebtModal();
    renderDebts();
    renderTransactions();
    renderWallets();
    updateReportChart();
    showToast('Utang lunas & berhasil dicatat ke Transaksi! 💰');
}

function sendDebtReminderAll() {
    showToast('Pengingat WhatsApp berhasil dikirim ke teman Anda! 📲');
}

// Prediction & Notification Functions (Telat Kustom Lebih Dari 5 Hari)
function updateProjection() {
    const saldo = Number(document.getElementById('projSaldoInput').value) || 500000;
    const daily = Number(document.getElementById('projSpendInput').value) || 30000;
    const lateDays = Number(document.getElementById('incomeLateDaysInput').value) || 0;
    
    const baseDays = Math.max(1, Math.ceil(saldo / daily));
    const totalDays = Math.min(60, baseDays + lateDays);
    
    const labels = [];
    const data = [];

    for(let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 8))) {
        labels.push(i === 0 ? 'Hari Ini' : `H+${i}`);
        data.push(Math.max(0, saldo - (daily * i)));
    }

    if(projChart) {
        projChart.data.labels = labels;
        projChart.data.datasets[0].data = data;
        projChart.update();
    }

    const depletion = new Date();
    depletion.setDate(depletion.getDate() + baseDays);
    
    const banner = document.getElementById('earlyWarningBannerText');
    if(banner) {
        banner.innerHTML = `"Tenang, dengan pace jajan saat ini, uangmu diproyeksikan habis tanggal <span class="bg-hsOrange text-white px-3 py-0.5 rounded-2xl inline-block">${depletion.toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</span>!"`;
    }
    
    document.getElementById('runwayDaysBadge').textContent = `${baseDays} Hari Lagi (Telat Kiriman +${lateDays} hari)`;
}

// Report & Export Functions
function updateReportChart() {
    if(!reportChart) return;
    const data = categories.map(c => transactions.filter(t => t.type === 'expense' && t.category === c).reduce((a,t) => a + t.amount, 0));
    
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((a,t) => a + t.amount, 0);
    const totalInc = transactions.filter(t => t.type === 'income').reduce((a,t) => a + t.amount, 0);

    document.getElementById('reportTotalExpense').textContent = rupiah(totalExp);
    document.getElementById('reportTotalIncome').textContent = rupiah(totalInc);

    reportChart.data.labels = categories;
    reportChart.data.datasets[0].data = data;
    reportChart.update();
}

function exportToExcel() {
    let csv = "ID,Nama,Jenis,Kategori,Dompet,Nominal,Tanggal\n";
    transactions.forEach(t => {
        csv += `${t.id},"${t.name}",${t.type},${t.category},${t.wallet},${t.amount},${t.date}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Laporan_ForeCash.csv');
    a.click();
    showToast('File CSV laporan berhasil diunduh 📊');
}

// Chart Initialization
function initCharts() {
    const ctx1 = document.getElementById('chartProyeksi').getContext('2d');
    projChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Hari Ini'],
            datasets: [{
                label: 'Proyeksi Saldo (Rp)',
                data: [560000],
                borderColor: '#FF7043',
                backgroundColor: 'rgba(255,112,67,.10)',
                borderWidth: 3,
                fill: true,
                tension: .4,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => 'Rp ' + Number(v).toLocaleString('id-ID') } }, x: { grid: { display: false } } }
        }
    });

    const ctx2 = document.getElementById('chartLaporan').getContext('2d');
    reportChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{ data: [1], backgroundColor: ['#FF7043','#FFC83D','#43B883','#5B8DEF','#8B6FE8','#E96868', '#34495E', '#1ABC9C'], borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}
