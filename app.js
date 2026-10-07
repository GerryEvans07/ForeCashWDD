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
let projChart = null;
let reportChart = null;

let transactions = JSON.parse(localStorage.getItem('forecash_transactions') || 'null') || [
    { id: 1, name: 'Nasi Goreng Kantin', amount: 15000, type: 'expense', category: 'Makan & Minum', wallet: 'Tunai Dompet', date: new Date().toISOString() },
    { id: 2, name: 'Kopi Susu Es', amount: 18000, type: 'expense', category: 'Jajan & Kopi', wallet: 'E-Wallet', date: new Date().toISOString() }
];

let debts = JSON.parse(localStorage.getItem('forecash_debts') || 'null') || [
    { id: 1, name: 'Bima', reason: 'Makbar Seblak', amount: 25000, direction: 'owedToMe' }
];

let wallets = JSON.parse(localStorage.getItem('forecash_wallets') || 'null') || {
    'Bank Ortu': 350000, 'Tunai Dompet': 85000, 'E-Wallet': 125000, 'Dana Darurat': 180000
};

window.onload = function() {
    initCharts();
    checkSession();
    renderTransactions();
    renderDebts();
    updateWalletCards();
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
}

// Authentication Functions
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
    saveAndLogin(name || 'Mahasiswa'); 
}

function handleQuickDemoLogin() { saveAndLogin('Budi Mahasiswa'); }

function saveAndLogin(userName) { 
    const user = { name: userName }; 
    localStorage.setItem('forecash_hs_user', JSON.stringify(user)); 
    applyUserSession(user); 
}

function checkSession() { 
    const saved = localStorage.getItem('forecash_hs_user'); 
    if(saved) applyUserSession(JSON.parse(saved)); 
}

function applyUserSession(user) { 
    document.getElementById('loginPage').classList.add('hidden'); 
    document.getElementById('mainDashboard').classList.remove('hidden'); 
    document.getElementById('userNameDisplay').innerText = user.name; 
    document.getElementById('profileNameDisplay').innerText = user.name; 
    document.getElementById('userAvatar').innerText = user.name.charAt(0).toUpperCase(); 
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
    resBox.innerHTML = `<strong>AI Response:</strong> Untuk menghemat budget jajan, coba utamakan makan di kantin kampus dan batasi pembelian kopi maksimal 2 kali seminggu. Sisa anggaranmu aman hingga akhir bulan!`;
}

// Dashboard Functions
function updateWalletCards() {
    document.getElementById('wallet-bank').textContent = rupiah(wallets['Bank Ortu']);
    document.getElementById('wallet-tunai').textContent = rupiah(wallets['Tunai Dompet']);
    document.getElementById('wallet-ewallet').textContent = rupiah(wallets['E-Wallet']);
    document.getElementById('wallet-darurat').textContent = rupiah(wallets['Dana Darurat']);
    const pct = Math.min(100, Math.round(wallets['Dana Darurat'] / 500000 * 100));
    document.getElementById('wallet-darurat-pct').textContent = `Buffer Safe (${pct}%)`;
}

// Transactions Functions
function openAddTransactionModal(){ const m = document.getElementById('transactionModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
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
    updateWalletCards();
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
                <button onclick="deleteTransaction(${t.id})" class="text-slate-300 hover:text-hsRed text-xs">×</button>
            </div>
        </div>
    `).join('');
}

function deleteTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if(!t) return;
    wallets[t.wallet] = Math.max(0, (wallets[t.wallet] || 0) + (t.type === 'income' ? -t.amount : t.amount));
    transactions = transactions.filter(x => x.id !== id);
    persistData();
    renderTransactions();
    updateWalletCards();
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

// Debts Functions
function openDebtModal(){ const m = document.getElementById('debtModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeDebtModal(){ const m = document.getElementById('debtModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function openSplitBillModal(){ const m = document.getElementById('splitBillModal'); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeSplitBillModal(){ const m = document.getElementById('splitBillModal'); m.classList.add('hidden'); m.classList.remove('flex'); }

function calculateSplitBill() {
    const total = Number(document.getElementById('sbTotal').value);
    const people = Number(document.getElementById('sbPeople').value) || 1;
    if(!total) return;
    const perPerson = Math.ceil(total / people);
    document.getElementById('sbResult').classList.remove('hidden');
    document.getElementById('sbPerPersonText').textContent = rupiah(perPerson);
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
            <div class="flex gap-2">
                <button onclick="deleteDebt(${d.id})" class="hs-btn bg-hsGreen text-white text-xs py-1.5 flex-1">Lunas / Selesai</button>
            </div>
        </div>
    `).join('');
}

function deleteDebt(id) {
    debts = debts.filter(d => d.id !== id);
    persistData();
    renderDebts();
    showToast('Catatan bon diselesaikan');
}

function sendDebtReminderAll() {
    showToast('Pengingat WhatsApp berhasil dikirim ke teman Anda! 📲');
}

// Prediction & Notification Functions
function updateProjection() {
    const saldo = Number(document.getElementById('projSaldoInput').value) || 500000;
    const daily = Number(document.getElementById('projSpendInput').value) || 30000;
    const late = document.getElementById('incomeLateCheck').checked;
    
    const days = Math.max(1, Math.ceil(saldo / daily));
    const totalDays = Math.min(30, days + (late ? 5 : 0));
    
    const labels = [];
    const data = [];

    for(let i = 0; i <= totalDays; i += 3) {
        labels.push(i === 0 ? 'Hari Ini' : `H+${i}`);
        data.push(Math.max(0, saldo - (daily * i)));
    }

    if(projChart) {
        projChart.data.labels = labels;
        projChart.data.datasets[0].data = data;
        projChart.update();
    }

    const depletion = new Date();
    depletion.setDate(depletion.getDate() + days);
    
    const banner = document.getElementById('earlyWarningBannerText');
    if(banner) {
        banner.innerHTML = `"Tenang, dengan pace jajan saat ini, uangmu diproyeksikan habis tanggal <span class="bg-hsOrange text-white px-3 py-0.5 rounded-2xl inline-block">${depletion.toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</span>!"`;
    }
    
    document.getElementById('runwayDaysBadge').textContent = `${days} Hari Lagi`;
}

// Report & Export Functions
function updateReportChart() {
    if(!reportChart) return;
    const cats = ['Makan & Minum', 'Jajan & Kopi', 'Akademik', 'Hiburan', 'Transportasi', 'Lainnya'];
    const data = cats.map(c => transactions.filter(t => t.type === 'expense' && t.category === c).reduce((a,t) => a + t.amount, 0));
    
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((a,t) => a + t.amount, 0);
    const totalInc = transactions.filter(t => t.type === 'income').reduce((a,t) => a + t.amount, 0);

    document.getElementById('reportTotalExpense').textContent = rupiah(totalExp);
    document.getElementById('reportTotalIncome').textContent = rupiah(totalInc);

    reportChart.data.labels = cats;
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
            labels: ['Makan & Minum'],
            datasets: [{ data: [1], backgroundColor: ['#FF7043','#FFC83D','#43B883','#5B8DEF','#8B6FE8','#E96868'], borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}