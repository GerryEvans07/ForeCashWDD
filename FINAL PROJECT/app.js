// Konfigurasi Tailwind CSS
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

// Pembolehubah Utama
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
    setupSliders();
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

function switchLoginTab(mode) {
    const btnSignIn = document.getElementById('btnTabSignIn'), btnSignUp = document.getElementById('btnTabSignUp');
    const nameBox = document.getElementById('signUpNameBox'), submitBtn = document.getElementById('authSubmitButton');
    isSignUp = mode === 'signup';
    btnSignUp.className = `w-1/2 py-2 text-xs sm:text-sm font-bold rounded-xl ${isSignUp ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500 hover:text-hsDark'} transition-all`;
    btnSignIn.className = `w-1/2 py-2 text-xs sm:text-sm font-bold rounded-xl ${!isSignUp ? 'bg-hsYellow text-hsDark shadow-sm' : 'text-slate-500 hover:text-hsDark'} transition-all`;
    nameBox.classList.toggle('hidden', !isSignUp);
    submitBtn.innerText = isSignUp ? 'Daftar Akun Baru 🚀' : 'Masuk Ke App 🚀';
}

function handleAuthSubmit(e) { e.preventDefault(); const email=document.getElementById('authEmailInput').value; const name=isSignUp?document.getElementById('authNameInput').value:email.split('@')[0]; saveAndLogin(name||'Mahasiswa'); }
function handleQuickDemoLogin() { saveAndLogin('Budi Mahasiswa'); }
function saveAndLogin(userName) { const user={name:userName}; localStorage.setItem('forecash_hs_user',JSON.stringify(user)); applyUserSession(user); }
function checkSession() { const saved=localStorage.getItem('forecash_hs_user'); if(saved) applyUserSession(JSON.parse(saved)); }
function applyUserSession(user) { document.getElementById('loginPage').classList.add('hidden'); document.getElementById('mainDashboard').classList.remove('hidden'); document.getElementById('userNameDisplay').innerText=user.name; document.getElementById('userAvatar').innerText=user.name.charAt(0).toUpperCase(); }
function handleLogout() { localStorage.removeItem('forecash_hs_user'); document.getElementById('mainDashboard').classList.add('hidden'); document.getElementById('loginPage').classList.remove('hidden'); }

function switchTab(tabName) {
    document.querySelectorAll('.page-content').forEach(el=>el.classList.add('hidden'));
    document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
    document.getElementById(`page-${tabName}`).classList.remove('hidden'); document.getElementById(`tab-${tabName}`).classList.add('active');
    if(tabName==='proyeksi'&&projChart) setTimeout(()=>projChart.resize(),100);
    if(tabName==='laporan'&&reportChart) setTimeout(()=>{updateReportChart();reportChart.resize();},100);
    if(tabName==='transaksi') renderTransactions();
    if(tabName==='utang') renderDebts();
}

function setupSliders() {
    const sInput = document.getElementById('projSaldoInput');
    const spInput = document.getElementById('projSpendInput');
    const sNumber = document.getElementById('projSaldoNumber');
    const spNumber = document.getElementById('projSpendNumber');

    function syncSaldo(value) {
        value = Math.min(2000000, Math.max(100000, parseInt(value) || 560000));
        sInput.value = value;
        sNumber.value = value;
        document.getElementById('projSaldoText').innerText = 'Rp ' + value.toLocaleString('id-ID');
        updateProjection();
    }

    function syncSpend(value) {
        value = Math.min(150000, Math.max(10000, parseInt(value) || 40000));
        spInput.value = value;
        spNumber.value = value;
        document.getElementById('projSpendText').innerText = 'Rp ' + value.toLocaleString('id-ID') + ' / hari';
        updateProjection();
    }

    if (sInput && sNumber) {
        sInput.addEventListener('input', e => syncSaldo(e.target.value));
        sNumber.addEventListener('input', e => syncSaldo(e.target.value));
        sNumber.addEventListener('blur', e => syncSaldo(e.target.value));
    }

    if (spInput && spNumber) {
        spInput.addEventListener('input', e => syncSpend(e.target.value));
        spNumber.addEventListener('input', e => syncSpend(e.target.value));
        spNumber.addEventListener('blur', e => syncSpend(e.target.value));
    }

    updateProjection();
    renderHomeExpenseHistory();
}

function updateProjection() {
    const saldo=Number(document.getElementById('projSaldoInput').value), daily=Number(document.getElementById('projSpendInput').value);
    const late=document.getElementById('incomeLateCheck').checked;
    const extraDays=late?5:0;
    const days=Math.max(1,Math.ceil(saldo/daily));
    const totalDays=Math.min(30,days+extraDays);
    const labels=[], data=[];
    for(let i=0;i<=totalDays;i+=Math.max(1,Math.ceil(totalDays/6))) { labels.push(i===0?'Hari Ini':`H+${i}`); data.push(Math.max(0,saldo-(daily*i))); }
    if(labels[labels.length-1]!==`H+${totalDays}`){labels.push(`H+${totalDays}`);data.push(Math.max(0,saldo-(daily*totalDays)));}
    if(projChart){projChart.data.labels=labels;projChart.data.datasets[0].data=data;projChart.update();}
    const depletion=new Date(); depletion.setDate(depletion.getDate()+days);
    const banner=document.querySelector('#page-home h2');
    if(banner) banner.innerHTML=`"Tenang ${escapeHTML((JSON.parse(localStorage.getItem('forecash_hs_user')||'{}').name||'kamu').split(' ')[0])}, dengan pace jajan saat ini, uangmu diproyeksikan habis tanggal <span class="bg-hsOrange text-white px-3 py-0.5 rounded-2xl inline-block">${depletion.toLocaleDateString('id-ID',{day:'numeric',month:'long'})}</span>!"`;
    const runway=document.querySelector('#page-home .bg-white.px-2\.5'); if(runway) runway.textContent=`${days} Hari Lagi`;
}

function openAddTransactionModal(){const m=document.getElementById('transactionModal');m.classList.remove('hidden');m.classList.add('flex');document.getElementById('txName').focus();}
function closeTransactionModal(){const m=document.getElementById('transactionModal');m.classList.add('hidden');m.classList.remove('flex');}
function saveTransaction(e){
    e.preventDefault(); const type=document.getElementById('txType').value, amount=Number(document.getElementById('txAmount').value), name=document.getElementById('txName').value.trim(), category=document.getElementById('txCategory').value, wallet=document.getElementById('txWallet').value;
    if(!amount||!name)return;
    transactions.unshift({id:Date.now(),name,amount,type,category,wallet,date:new Date().toISOString()});
    wallets[wallet]=Math.max(0,(wallets[wallet]||0)+(type==='income'?amount:-amount)); persistData(); closeTransactionModal(); e.target.reset(); renderTransactions(); updateWalletCards(); updateReportChart(); updateProjection(); showToast('Transaksi berhasil disimpan ✨');
}

function renderTransactions(){
    const card=document.querySelector('#page-transaksi .lg\\:col-span-7 .hs-card'); if(!card)return;
    const total=transactions.filter(t=>t.type==='expense'&&new Date(t.date).toDateString()===new Date().toDateString()).reduce((a,t)=>a+t.amount,0);
    card.innerHTML=`<div class="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b"><span>TRANSAKSI TERBARU</span><span class="text-hsRed">- ${rupiah(total)}</span></div>`+
    transactions.slice(0,8).map(t=>`<div class="flex justify-between items-center gap-3 py-2 border-b border-slate-50 last:border-0"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 rounded-2xl ${t.type==='income'?'bg-hsGreen/10 text-hsGreen':'bg-hsOrange/10 text-hsOrange'} flex items-center justify-center text-lg">${t.type==='income'?'💰':'🧾'}</div><div class="min-w-0"><h5 class="font-bold text-sm text-hsDark truncate">${escapeHTML(t.name)}</h5><p class="text-[11px] font-semibold text-slate-400">${escapeHTML(t.wallet)} • ${escapeHTML(t.category)}</p></div></div><div class="flex items-center gap-2"><span class="font-black ${t.type==='income'?'text-hsGreen':'text-hsRed'} text-sm whitespace-nowrap">${t.type==='income'?'+':'-'} ${rupiah(t.amount)}</span><button onclick="deleteTransaction(${t.id})" class="text-slate-300 hover:text-hsRed">×</button></div></div>`).join('');
}

function deleteTransaction(id){const t=transactions.find(x=>x.id===id);if(!t)return;wallets[t.wallet]=Math.max(0,(wallets[t.wallet]||0)+(t.type==='income'?-t.amount:t.amount));transactions=transactions.filter(x=>x.id!==id);persistData();renderTransactions();updateWalletCards();updateReportChart();showToast('Transaksi dihapus');}

function updateWalletCards(){
    const vals=['Bank Ortu','Tunai Dompet','E-Wallet','Dana Darurat'];
    document.querySelectorAll('#page-home .wallet-card p.text-2xl').forEach((el,i)=>{if(vals[i])el.textContent=rupiah(wallets[vals[i]]);});
    const emergency=document.querySelector('#page-home .wallet-card:nth-child(4) p.text-\\[11px\\]'); if(emergency){const pct=Math.min(100,Math.round(wallets['Dana Darurat']/500000*100));emergency.textContent=`Buffer Safe (${pct}%)`;}
}

function simulateOCR(event){
    const file=event&&event.target&&event.target.files&&event.target.files[0]; if(!file)return;
    if(!file.type.startsWith('image/')){showToast('File harus berupa gambar');return;}
    const reader=new FileReader(); reader.onload=e=>{document.getElementById('receiptImage').src=e.target.result;document.getElementById('receiptPreview').classList.remove('hidden');document.getElementById('ocrBox').classList.remove('hidden');showToast('Struk berhasil dibaca — mode OCR demo');}; reader.readAsDataURL(file);
}

function setSmartReminder(){
    localStorage.setItem('forecash_reminder','1'); const btn=document.getElementById('reminderButton'); btn.textContent='✓ Diingatkan Nanti'; btn.classList.add('text-hsGreen'); showToast('Pengingat disimpan di browser ini 🔔');
    if('Notification' in window && Notification.permission==='granted') new Notification('ForeCash Reminder',{body:'Ingat cek budget jajanmu hari ini.'});
    else if('Notification' in window && Notification.permission==='default') Notification.requestPermission().then(p=>{if(p==='granted')new Notification('ForeCash Reminder',{body:'Ingat cek budget jajanmu hari ini.'});});
}

function openDebtModal(){const m=document.getElementById('debtModal');m.classList.remove('hidden');m.classList.add('flex');document.getElementById('debtName').focus();}
function closeDebtModal(){const m=document.getElementById('debtModal');m.classList.add('hidden');m.classList.remove('flex');}
function saveDebt(e){e.preventDefault();debts.unshift({id:Date.now(),name:document.getElementById('debtName').value.trim(),reason:document.getElementById('debtReason').value.trim(),amount:Number(document.getElementById('debtAmount').value),direction:document.getElementById('debtDirection').value});persistData();closeDebtModal();e.target.reset();renderDebts();showToast('Catatan bon berhasil disimpan 🤝');}

function renderDebts(){
    const grid=document.querySelector('#page-utang .grid.grid-cols-1.sm\\:grid-cols-2');if(!grid)return;
    grid.innerHTML=debts.map(d=>`<div class="p-5 rounded-3xl ${d.direction==='owedToMe'?'bg-hsYellow/20 border-hsYellow':'bg-hsBlue/10 border-hsBlue/30'} border flex flex-col justify-between space-y-3"><div class="flex justify-between items-start gap-3"><div><h5 class="font-black text-hsDark text-base">${escapeHTML(d.name)} (${escapeHTML(d.reason)})</h5><span class="text-[10px] font-extrabold ${d.direction==='owedToMe'?'bg-hsGreen':'bg-hsBlue'} text-white px-2 py-0.5 rounded-full">${d.direction==='owedToMe'?'Dia Utang Ke Kamu':'Kamu Utang Ke Dia'}</span></div><span class="font-black text-hsDark text-lg whitespace-nowrap">${rupiah(d.amount)}</span></div><div class="flex gap-2"><button onclick="markDebtPaid(${d.id}, this)" class="hs-btn bg-hsGreen text-white text-xs py-2 flex-1 flex items-center justify-center gap-2"><i class="fa-solid fa-circle-check text-base"></i> Sudah Bayar</button><button onclick="deleteDebt(${d.id})" class="hs-btn bg-white text-hsRed px-3">×</button></div></div>`).join('');
}

function markDebtPaid(id, btn){
    const debt=debts.find(d=>d.id===id);
    if(!debt)return;
    const card=btn.closest('.rounded-3xl');
    if(card){
        card.classList.remove('bg-hsYellow/20','border-hsYellow','bg-hsBlue/10','border-hsBlue/30');
        card.classList.add('bg-hsGreen/10','border-hsGreen/30');
    }
    btn.disabled=true;
    btn.classList.remove('bg-hsGreen','text-white');
    btn.classList.add('bg-white','text-hsGreen');
    btn.innerHTML='<i class="fa-solid fa-circle-check text-base"></i> Sudah Bayar';
    debts=debts.filter(d=>d.id!==id);
    persistData();
    setTimeout(()=>renderDebts(),450);
    showToast(`${debt.name} sudah ditandai sebagai lunas ✓`);
}

function deleteDebt(id){debts=debts.filter(d=>d.id!==id);persistData();renderDebts();showToast('Catatan bon dihapus');}

function updateReportChart(){
    if(!reportChart)return; const cats=['Makan & Minum','Jajan & Kopi','Akademik','Hiburan','Transportasi','Lainnya']; const data=cats.map(c=>transactions.filter(t=>t.type==='expense'&&t.category===c).reduce((a,t)=>a+t.amount,0));
    reportChart.data.labels=cats.filter((_,i)=>data[i]>0); reportChart.data.datasets[0].data=data.filter(v=>v>0); reportChart.update();
}

function initCharts(){
    const ctx1=document.getElementById('chartProyeksi').getContext('2d'); projChart=new Chart(ctx1,{type:'line',data:{labels:['Hari Ini'],datasets:[{label:'Proyeksi Saldo (Rp)',data:[560000],borderColor:'#FF7043',backgroundColor:'rgba(255,112,67,.10)',borderWidth:3,fill:true,tension:.4,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'Rp '+Number(v).toLocaleString('id-ID')}},x:{grid:{display:false}}}}});
    const ctx2=document.getElementById('chartLaporan').getContext('2d'); reportChart=new Chart(ctx2,{type:'doughnut',data:{labels:['Makan & Minum'],datasets:[{data:[1],backgroundColor:['#FF7043'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom'}}}});
}