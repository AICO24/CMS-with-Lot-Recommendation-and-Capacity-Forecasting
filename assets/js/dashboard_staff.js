// dashboard_staff.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    fetch('../assets/includes/sidebar-staff.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('sidebarContainer').innerHTML = html;
            const currentPage = window.location.pathname.split('/').pop();
            document.querySelectorAll('.sidebar-nav a').forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
            if (toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
            }
        })
        .catch(err => console.error('Sidebar load error:', err));

    const session = JSON.parse(localStorage.getItem('cemetery_session')) || null;
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    if (session.role !== 'staff') {
        window.location.href = 'dashboard_admin.html';
        return;
    }

    document.getElementById('userName').textContent = session.fullName || session.username;
    document.getElementById('userRole').textContent = (session.role || 'STAFF').toUpperCase();

    const perms = session.permissions || [];
    document.querySelectorAll('.nav-item').forEach(el => {
        const perm = el.getAttribute('data-perm');
        if (perm && !perms.includes(perm)) el.style.display = 'none';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('cemetery_session');
        window.location.href = 'login.html';
    });

    async function loadModule(page) {
        if (!page || page === 'dashboard') {
            renderStats(); renderAvailability(); renderAISuggestion(); renderChart(); renderRecent();
            document.getElementById('pageTitle').textContent = 'Staff Dashboard';
            return;
        }
        const adminOnly = ['user-management','audit','ai'];
        if (adminOnly.includes(page) && session.role !== 'admin') {
            document.getElementById('contentArea').innerHTML = `<div class="card"><h3>Access denied</h3><p>This module is for administrators only.</p></div>`;
            document.getElementById('pageTitle').textContent = 'Access Denied';
            return;
        }
        const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navEl) {
            const requiredPerm = navEl.getAttribute('data-perm');
            if (requiredPerm && !perms.includes(requiredPerm)) {
                document.getElementById('contentArea').innerHTML = `<div class="card"><h3>Access denied</h3><p>You do not have permission to view this module.</p></div>`;
                document.getElementById('pageTitle').textContent = 'Access Denied';
                return;
            }
        }
        document.getElementById('pageTitle').textContent = page.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
        try {
            const r = await fetch(`modules/${page}.html`);
            if (!r.ok) throw new Error('not found');
            const html = await r.text();
            document.getElementById('contentArea').innerHTML = html;
            const cssId = 'module-css';
            const oldCss = document.getElementById(cssId);
            if (oldCss) oldCss.remove();
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `../assets/css/modules/${page}.css`;
            document.head.appendChild(link);
            const jsId = 'module-js';
            const oldJs = document.getElementById(jsId);
            if (oldJs) oldJs.remove();
            const script = document.createElement('script');
            script.id = jsId;
            script.src = `../assets/js/modules/${page}.js`;
            script.defer = true;
            document.body.appendChild(script);
        } catch(err) {
            document.getElementById('contentArea').innerHTML = `<div class="card"><h3>${page}</h3><p>Module not implemented yet.</p></div>`;
        }
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') return;
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (!page) return;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            loadModule(page);
        });
    });

    loadModule('dashboard');

    function seedDemoData() {
        if (!localStorage.getItem('lots')) {
            const lots = [];
            const sections = ['Section A','Section B','Section C','Section D'];
            let id = 1;
            sections.forEach((sec,si)=>{
                for(let r=0;r<50;r++){
                    lots.push({ lot_id: id, section: sec, lot_number: `${String.fromCharCode(65+si)}-${r+1}`, status: (Math.random()>0.7? 'Occupied':'Available'), lot_type: 'Lawn', price: 5000 + (si*1000), created_at: new Date().toISOString() });
                    id++;
                }
            });
            localStorage.setItem('lots', JSON.stringify(lots));
        }
        if (!localStorage.getItem('burial_schedules')) {
            const schedules = [];
            for(let i=0;i<8;i++){
                schedules.push({ schedule_id: i+1, lot_id: i+1, deceased_name: `Person ${i+1}`, schedule_date: new Date(Date.now() + i*86400000).toISOString().slice(0,10), status: 'Confirmed' });
            }
            localStorage.setItem('burial_schedules', JSON.stringify(schedules));
        }
        if (!localStorage.getItem('payments')) {
            const payments = [
                { payment_id:1, reference_id:101, amount:4500, payment_date: new Date().toISOString().slice(0,10), payment_method:'Cash', receipt_number:'R-1001' },
                { payment_id:2, reference_id:102, amount:8000, payment_date: new Date().toISOString().slice(0,10), payment_method:'Card', receipt_number:'R-1002' }
            ];
            localStorage.setItem('payments', JSON.stringify(payments));
        }
    }
    seedDemoData();

    function renderStats(){
        const lots = JSON.parse(localStorage.getItem('lots')||'[]');
        const total = lots.filter(l=>l.status==='Occupied').length;
        const available = lots.filter(l=>l.status==='Available').length;
        const payments = JSON.parse(localStorage.getItem('payments')||'[]');
        const revenue = payments.reduce((s,p)=>s + (p.amount||0),0);
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statAvailable').textContent = available;
        document.getElementById('statRevenue').textContent = `₱ ${revenue.toLocaleString()}`;
        document.getElementById('statForecast').textContent = Math.min(98, Math.round((available / Math.max(1, lots.length)) * 100)) + '%';
    }

    function renderAvailability(){
        const map = document.getElementById('availabilityMap');
        map.innerHTML = '';
        const lots = JSON.parse(localStorage.getItem('lots')||'[]');
        const sections = [...new Set(lots.map(l=>l.section))];
        sections.forEach(sec=>{
            const col = document.createElement('div'); col.className='section-col';
            const title = document.createElement('div'); title.className='section-title'; title.textContent = sec;
            const grid = document.createElement('div'); grid.className='section-grid';
            const secLots = lots.filter(l=>l.section===sec);
            secLots.slice(0,100).forEach(l=>{
                const sq = document.createElement('div'); sq.className='square '+(l.status==='Occupied'? 'occupied':'available');
                sq.title = `${l.lot_number} - ${l.status}`;
                grid.appendChild(sq);
            });
            col.appendChild(title); col.appendChild(grid);
            const legend = document.createElement('div'); legend.className='legend'; legend.innerHTML = `<div><span class="pill" style="background:#9dbf5a"></span> Available</div><div><span class="pill" style="background:#d63447"></span> Occupied</div>`;
            col.appendChild(legend);
            map.appendChild(col);
        });
    }

    function renderAISuggestion(){
        const lots = JSON.parse(localStorage.getItem('lots')||'[]');
        const avail = lots.filter(l=>l.status==='Available');
        if(avail.length===0) return;
        const pick = avail.sort((a,b)=>a.price - b.price)[0];
        document.getElementById('aiLot').textContent = `${pick.lot_number} — ${pick.section}`;
        const score = Math.min(97, 60 + Math.floor(Math.random()*35));
        document.getElementById('aiProgressBar').style.width = score + '%';
        document.getElementById('aiNote').textContent = `Suitability ${score}% — priced ₱${pick.price.toLocaleString()}`;
    }

    function renderChart(){
        const ctx = document.getElementById('occChart').getContext('2d');
        const labels = ['Jan','Feb','Mar','Apr','May','Jun'];
        const data = { labels, datasets: [{ label:'Occupancy', data: labels.map(()=> Math.floor(200 + Math.random()*150)), backgroundColor: '#7aa77a' }] };
        new Chart(ctx, { type:'bar', data, options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} } });
    }

    function renderRecent(){
        const list = document.getElementById('recentList'); list.innerHTML='';
        const schedules = JSON.parse(localStorage.getItem('burial_schedules')||'[]');
        const payments = JSON.parse(localStorage.getItem('payments')||'[]');
        const items = [];
        schedules.slice(0,5).forEach(s=> items.push({title: s.deceased_name + ' - Burial', date: s.schedule_date, status: s.status || 'Pending'}));
        payments.slice(0,5).forEach(p=> items.push({title: `Payment ${p.receipt_number}`, date: p.payment_date, status: 'Completed'}));
        items.slice(0,6).forEach(it=>{
            const li = document.createElement('li'); li.innerHTML = `<div><strong>${it.title}</strong><div class="recent-note">${it.date}</div></div><div><span class="pill small">${it.status}</span></div>`;
            list.appendChild(li);
        });
    }

    renderStats(); renderAvailability(); renderAISuggestion(); renderChart(); renderRecent();
});