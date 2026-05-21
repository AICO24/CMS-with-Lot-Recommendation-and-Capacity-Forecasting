// lot-management.js – temporary in-memory storage (resets on refresh)
document.addEventListener('DOMContentLoaded', function() {
    // ---------- SESSION & AUTH ----------
    const session = JSON.parse(localStorage.getItem('cemetery_session'));
    if (!session || !session.userId) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('userName').innerText = session.fullName || session.username;
    document.getElementById('userRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    document.getElementById('sidebarUserName').innerText = session.fullName || session.username;
    document.getElementById('sidebarUserRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    if (session.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('cemetery_session');
        window.location.href = 'login.html';
    });

    // ---------- TEMPORARY LOT DATA (in-memory, resets on refresh) ----------
    let lots = [
        { id: 1, lotNumber: 'A-001', section: 'Section A', block: 'Block 1', type: 'Lawn Lot', price: 5500, status: 'Available', notes: 'Near chapel' },
        { id: 2, lotNumber: 'A-002', section: 'Section A', block: 'Block 1', type: 'Lawn Lot', price: 5800, status: 'Occupied', notes: 'Leased until 2030' },
        { id: 3, lotNumber: 'B-001', section: 'Section B', block: 'Block 2', type: 'Family Lot', price: 8500, status: 'Available', notes: 'Corner lot' },
        { id: 4, lotNumber: 'B-002', section: 'Section B', block: 'Block 2', type: 'Family Lot', price: 8200, status: 'Reserved', notes: 'Reserved for Smith family' },
        { id: 5, lotNumber: 'C-001', section: 'Section C', block: '', type: 'Mausoleum', price: 12500, status: 'Available', notes: 'Premium view' },
        { id: 6, lotNumber: 'D-001', section: 'Section D', block: 'Block 3', type: 'Cremation Niche', price: 3500, status: 'Occupied', notes: 'Ash storage' },
    ];
    let nextId = 7;
    const sections = ['Section A', 'Section B', 'Section C', 'Section D'];
    let currentSection = 'Section A';

    function render() {
        updateStats();
        renderTabs();
        renderGrid();
    }
    function updateStats() {
        document.getElementById('availableCount').innerText = lots.filter(l => l.status === 'Available').length;
        document.getElementById('occupiedCount').innerText = lots.filter(l => l.status === 'Occupied').length;
        document.getElementById('reservedCount').innerText = lots.filter(l => l.status === 'Reserved').length;
        document.getElementById('totalCount').innerText = lots.length;
    }
    function renderTabs() {
        const container = document.getElementById('sectionTabs');
        container.innerHTML = sections.map(s => `<button class="tab-btn ${s === currentSection ? 'active' : ''}" data-section="${s}">${s}</button>`).join('');
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSection = btn.dataset.section;
                renderTabs();
                renderGrid();
            });
        });
    }
    function renderGrid() {
        const grid = document.getElementById('lotGrid');
        const filtered = lots.filter(l => l.section === currentSection);
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="no-lots">No lots in this section. Click "Add New Lot" to add.</div>';
            return;
        }
        grid.innerHTML = filtered.map(lot => `
            <div class="lot-card" data-id="${lot.id}">
                <div class="lot-top"><span class="lot-number">${lot.lotNumber}</span><span class="lot-type">${lot.type}</span></div>
                <div class="lot-price">$${lot.price.toLocaleString()}</div>
                <div class="lot-status status-${lot.status}">${lot.status}</div>
                <div class="lot-meta">${lot.block || 'No block specified'}</div>
            </div>
        `).join('');
        document.querySelectorAll('.lot-card').forEach(card => {
            card.addEventListener('click', () => showViewModal(parseInt(card.dataset.id)));
        });
    }
    function showViewModal(id) {
        const lot = lots.find(l => l.id === id);
        if (!lot) return;
        document.getElementById('viewDetails').innerHTML = `
            <div class="detail-row"><span>Lot Number</span><strong>${lot.lotNumber}</strong></div>
            <div class="detail-row"><span>Section</span><strong>${lot.section}</strong></div>
            <div class="detail-row"><span>Block</span><strong>${lot.block || '—'}</strong></div>
            <div class="detail-row"><span>Type</span><strong>${lot.type}</strong></div>
            <div class="detail-row"><span>Price</span><strong>$${lot.price.toLocaleString()}</strong></div>
            <div class="detail-row"><span>Status</span><strong>${lot.status}</strong></div>
            <div class="detail-row"><span>Notes</span><strong>${lot.notes || 'None'}</strong></div>
        `;
        const modal = document.getElementById('viewModal');
        modal.style.display = 'flex';
        document.getElementById('editFromView').onclick = () => {
            modal.style.display = 'none';
            openEditModal(id);
        };
        let deleteBtn = document.getElementById('deleteFromView');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteFromView';
            deleteBtn.className = 'btn-delete';
            deleteBtn.innerText = 'Delete Lot';
            document.getElementById('editFromView').parentNode.insertBefore(deleteBtn, document.getElementById('editFromView').nextSibling);
        }
        deleteBtn.onclick = () => {
            if (confirm(`Delete lot ${lot.lotNumber}? This is temporary and will revert on refresh.`)) {
                lots = lots.filter(l => l.id !== lot.id);
                modal.style.display = 'none';
                render();
            }
        };
    }
    function openAddModal() {
        document.getElementById('modalTitle').innerText = 'Add New Lot';
        document.getElementById('lotForm').reset();
        document.getElementById('lotId').value = '';
        document.getElementById('lotSection').value = currentSection;
        document.getElementById('lotModal').style.display = 'flex';
    }
    function openEditModal(id) {
        const lot = lots.find(l => l.id === id);
        if (!lot) return;
        document.getElementById('modalTitle').innerText = 'Edit Lot';
        document.getElementById('lotId').value = lot.id;
        document.getElementById('lotNumber').value = lot.lotNumber;
        document.getElementById('lotSection').value = lot.section;
        document.getElementById('lotBlock').value = lot.block || '';
        document.getElementById('lotType').value = lot.type;
        document.getElementById('lotPrice').value = lot.price;
        document.getElementById('lotStatus').value = lot.status;
        document.getElementById('lotNotes').value = lot.notes || '';
        document.getElementById('lotModal').style.display = 'flex';
    }
    function saveLot(event) {
        event.preventDefault();
        const idValue = document.getElementById('lotId').value;
        const newLot = {
            lotNumber: document.getElementById('lotNumber').value.trim(),
            section: document.getElementById('lotSection').value,
            block: document.getElementById('lotBlock').value.trim(),
            type: document.getElementById('lotType').value,
            price: Number(document.getElementById('lotPrice').value),
            status: document.getElementById('lotStatus').value,
            notes: document.getElementById('lotNotes').value.trim(),
        };
        if (idValue) {
            const index = lots.findIndex(l => l.id === Number(idValue));
            if (index !== -1) lots[index] = { ...lots[index], ...newLot };
        } else {
            lots.push({ id: nextId++, ...newLot });
        }
        document.getElementById('lotModal').style.display = 'none';
        render();
    }
    document.getElementById('openAddLotModal').addEventListener('click', openAddModal);
    document.getElementById('lotForm').addEventListener('submit', saveLot);
    document.querySelector('.close').addEventListener('click', () => document.getElementById('lotModal').style.display = 'none');
    document.querySelector('.close-view').addEventListener('click', () => document.getElementById('viewModal').style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('lotModal')) document.getElementById('lotModal').style.display = 'none';
        if (e.target === document.getElementById('viewModal')) document.getElementById('viewModal').style.display = 'none';
    });
    render();
});