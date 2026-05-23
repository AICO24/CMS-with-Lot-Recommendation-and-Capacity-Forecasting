// cremation-management.js – temporary in-memory storage (resets on refresh)
document.addEventListener('DOMContentLoaded', function() {
    // ========== SESSION & AUTH ==========
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

    // ========== TEMPORARY NICHE DATA (in-memory, resets on refresh) ==========
    let niches = [
        { id: 1, nicheNumber: 'N-001', columbarium: 'Columbarium A', level: 1, assignedDecedentId: 1, assignedDecedentName: 'John Smith', notes: '', status: 'occupied' },
        { id: 2, nicheNumber: 'N-002', columbarium: 'Columbarium A', level: 1, assignedDecedentId: null, assignedDecedentName: null, notes: '', status: 'available' },
        { id: 3, nicheNumber: 'N-003', columbarium: 'Columbarium B', level: 1, assignedDecedentId: 2, assignedDecedentName: 'Mary Johnson', notes: '', status: 'occupied' },
        { id: 4, nicheNumber: 'N-004', columbarium: 'Columbarium B', level: 2, assignedDecedentId: null, assignedDecedentName: null, notes: '', status: 'available' },
        { id: 5, nicheNumber: 'N-005', columbarium: 'Columbarium C', level: 1, assignedDecedentId: 3, assignedDecedentName: 'Robert Davis', notes: 'Premium location', status: 'occupied' },
        { id: 6, nicheNumber: 'N-006', columbarium: 'Columbarium C', level: 2, assignedDecedentId: null, assignedDecedentName: null, notes: '', status: 'available' },
        { id: 7, nicheNumber: 'N-007', columbarium: 'Columbarium D', level: 1, assignedDecedentId: 4, assignedDecedentName: 'Patricia Wilson', notes: '', status: 'occupied' },
        { id: 8, nicheNumber: 'N-008', columbarium: 'Columbarium D', level: 2, assignedDecedentId: null, assignedDecedentName: null, notes: '', status: 'available' },
        { id: 9, nicheNumber: 'N-009', columbarium: 'Columbarium D', level: 3, assignedDecedentId: null, assignedDecedentName: null, notes: '', status: 'available' },
    ];
    let nextId = 10;

    // Helper: get decedents from localStorage (or use demo if empty)
    function getDecedents() {
        let decedents = JSON.parse(localStorage.getItem('cemetery_decedents') || '[]');
        if (decedents.length === 0) {
            decedents = [
                { id: 1, firstName: 'John', lastName: 'Smith' },
                { id: 2, firstName: 'Mary', lastName: 'Johnson' },
                { id: 3, firstName: 'Robert', lastName: 'Davis' },
                { id: 4, firstName: 'Patricia', lastName: 'Wilson' },
                { id: 5, firstName: 'Michael', lastName: 'Brown' },
                { id: 6, firstName: 'Linda', lastName: 'Martinez' },
            ];
        }
        return decedents;
    }

    function render() {
        updateStats();
        renderGrid();
    }

    function updateStats() {
        const total = niches.length;
        const occupied = niches.filter(n => n.status === 'occupied').length;
        const available = total - occupied;
        const rate = total ? Math.round((occupied / total) * 100) : 0;
        document.getElementById('totalNiches').innerText = total;
        document.getElementById('occupiedNiches').innerText = occupied;
        document.getElementById('availableNiches').innerText = available;
        document.getElementById('occupancyRate').innerText = `${rate}%`;
    }

    function renderGrid() {
        const container = document.getElementById('columbariumGrid');
        if (niches.length === 0) {
            container.innerHTML = '<div class="no-lots">No niches available. Click "Add New Niche" to create one.</div>';
            return;
        }
        container.innerHTML = niches.map(niche => `
            <div class="niche-card" data-id="${niche.id}">
                <div class="niche-number">${niche.nicheNumber}</div>
                <div class="niche-location">${niche.columbarium} | Level ${niche.level}</div>
                <div class="niche-status status-${niche.status}">${niche.status === 'occupied' ? 'Occupied' : 'Available'}</div>
                ${niche.assignedDecedentName ? `<div class="deceased-name">${niche.assignedDecedentName}</div>` : ''}
            </div>
        `).join('');
        document.querySelectorAll('.niche-card').forEach(card => {
            card.addEventListener('click', () => showViewModal(parseInt(card.dataset.id)));
        });
    }

    function populateDecedentDropdown() {
        const decedents = getDecedents();
        const select = document.getElementById('assignedDecedent');
        select.innerHTML = '<option value="">None (Available)</option>' +
            decedents.map(d => `<option value="${d.id}" data-name="${d.firstName} ${d.lastName}">${d.firstName} ${d.lastName}</option>`).join('');
    }

    function showViewModal(id) {
        const niche = niches.find(n => n.id === id);
        if (!niche) return;
        const details = `
            <div class="detail-row"><span>Niche Number</span><strong>${niche.nicheNumber}</strong></div>
            <div class="detail-row"><span>Columbarium</span><strong>${niche.columbarium}</strong></div>
            <div class="detail-row"><span>Level</span><strong>${niche.level}</strong></div>
            <div class="detail-row"><span>Status</span><strong>${niche.status === 'occupied' ? 'Occupied' : 'Available'}</strong></div>
            <div class="detail-row"><span>Assigned To</span><strong>${niche.assignedDecedentName || '—'}</strong></div>
            <div class="detail-row"><span>Notes</span><strong>${niche.notes || 'None'}</strong></div>
        `;
        document.getElementById('viewDetails').innerHTML = details;
        const modal = document.getElementById('viewModal');
        modal.style.display = 'flex';
        document.getElementById('editFromView').onclick = () => {
            modal.style.display = 'none';
            openEditModal(id);
        };
        document.getElementById('assignFromView').onclick = () => {
            modal.style.display = 'none';
            openAssignModal(id);
        };
        let deleteBtn = document.getElementById('deleteFromView');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteFromView';
            deleteBtn.className = 'btn-delete';
            deleteBtn.innerText = 'Delete Niche';
            const assignBtn = document.getElementById('assignFromView');
            assignBtn.parentNode.insertBefore(deleteBtn, assignBtn.nextSibling);
        }
        deleteBtn.onclick = () => {
            if (confirm(`Delete niche ${niche.nicheNumber}? This is temporary and will revert on refresh.`)) {
                niches = niches.filter(n => n.id !== niche.id);
                modal.style.display = 'none';
                render();
            }
        };
    }

    function openAddModal() {
        document.getElementById('modalTitle').innerText = 'Add New Niche';
        document.getElementById('nicheForm').reset();
        document.getElementById('nicheId').value = '';
        document.getElementById('assignedDecedent').value = '';
        populateDecedentDropdown();
        document.getElementById('nicheModal').style.display = 'flex';
    }

    function openEditModal(id) {
        const niche = niches.find(n => n.id === id);
        if (!niche) return;
        document.getElementById('modalTitle').innerText = 'Edit Niche';
        document.getElementById('nicheId').value = niche.id;
        document.getElementById('nicheNumber').value = niche.nicheNumber;
        document.getElementById('columbarium').value = niche.columbarium;
        document.getElementById('level').value = niche.level;
        document.getElementById('nicheNotes').value = niche.notes || '';
        populateDecedentDropdown();
        if (niche.assignedDecedentId) {
            document.getElementById('assignedDecedent').value = niche.assignedDecedentId;
        } else {
            document.getElementById('assignedDecedent').value = '';
        }
        document.getElementById('nicheModal').style.display = 'flex';
    }

    function openAssignModal(id) {
        const niche = niches.find(n => n.id === id);
        if (!niche) return;
        document.getElementById('modalTitle').innerText = 'Assign Decedent to Niche';
        document.getElementById('nicheId').value = niche.id;
        document.getElementById('nicheNumber').value = niche.nicheNumber;
        document.getElementById('columbarium').value = niche.columbarium;
        document.getElementById('level').value = niche.level;
        populateDecedentDropdown();
        document.getElementById('assignedDecedent').value = '';
        document.getElementById('nicheNotes').value = niche.notes || '';
        document.getElementById('nicheModal').style.display = 'flex';
    }

    function saveNiche(event) {
        event.preventDefault();
        const id = document.getElementById('nicheId').value;
        const nicheNumber = document.getElementById('nicheNumber').value.trim();
        const columbarium = document.getElementById('columbarium').value;
        const level = parseInt(document.getElementById('level').value);
        const assignedDecedentId = document.getElementById('assignedDecedent').value;
        const notes = document.getElementById('nicheNotes').value.trim();
        let assignedDecedentName = null;
        let status = 'available';
        if (assignedDecedentId) {
            const decedents = getDecedents();
            const decedent = decedents.find(d => d.id == assignedDecedentId);
            if (decedent) {
                assignedDecedentName = `${decedent.firstName} ${decedent.lastName}`;
                status = 'occupied';
            }
        }
        const newNiche = {
            nicheNumber,
            columbarium,
            level,
            assignedDecedentId: assignedDecedentId ? parseInt(assignedDecedentId) : null,
            assignedDecedentName,
            notes,
            status
        };
        if (id) {
            const index = niches.findIndex(n => n.id == id);
            if (index !== -1) {
                niches[index] = { ...niches[index], ...newNiche, id: parseInt(id) };
            }
        } else {
            newNiche.id = nextId++;
            niches.push(newNiche);
        }
        document.getElementById('nicheModal').style.display = 'none';
        render();
    }

    document.getElementById('openAddModal').addEventListener('click', openAddModal);
    document.getElementById('nicheForm').addEventListener('submit', saveNiche);
    document.querySelector('.close').addEventListener('click', () => document.getElementById('nicheModal').style.display = 'none');
    document.querySelector('.close-view').addEventListener('click', () => document.getElementById('viewModal').style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('nicheModal')) document.getElementById('nicheModal').style.display = 'none';
        if (e.target === document.getElementById('viewModal')) document.getElementById('viewModal').style.display = 'none';
    });

    render();
});