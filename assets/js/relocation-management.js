// ============================================
// RELOCATION & EXHUMATION MODULE
// Temporary in-memory storage (resets on refresh)
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // ---------- SESSION & AUTH ----------
    const session = JSON.parse(localStorage.getItem('cemetery_session'));
    if (!session || !session.userId) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info in top bar and sidebar
    document.getElementById('userName').innerText = session.fullName || session.username;
    document.getElementById('userRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    document.getElementById('sidebarUserName').innerText = session.fullName || session.username;
    document.getElementById('sidebarUserRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';

    // Hide admin-only menu items for staff
    if (session.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('cemetery_session');
        window.location.href = 'login.html';
    });

    // ---------- TEMPORARY DEMO DATA (resets on refresh) ----------
    let relocationRequests = [
        {
            id: 1,
            decedentId: 1,
            decedentName: 'John Smith',
            fromLotId: 1,
            fromLotNumber: 'A-125',
            toLotId: 2,
            toLotNumber: 'A-089',
            reason: 'Family requested transfer to a newer lot',
            status: 'pending',
            createdAt: '2026-05-20',
            updatedAt: '2026-05-20'
        },
        {
            id: 2,
            decedentId: 2,
            decedentName: 'Mary Johnson',
            fromLotId: 3,
            fromLotNumber: 'B-087',
            toLotId: 4,
            toLotNumber: 'B-156',
            reason: 'Lease expiration – renewal not possible',
            status: 'approved',
            createdAt: '2026-05-18',
            updatedAt: '2026-05-19'
        },
        {
            id: 3,
            decedentId: 3,
            decedentName: 'Robert Davis',
            fromLotId: 5,
            fromLotNumber: 'C-234',
            toLotId: 6,
            toLotNumber: 'D-001',
            reason: 'Exhumation for forensic investigation',
            status: 'completed',
            createdAt: '2026-05-10',
            updatedAt: '2026-05-15'
        }
    ];
    let nextId = 4;

    // Helper: get decedents from localStorage (or fallback)
    function getDecedents() {
        let decedents = JSON.parse(localStorage.getItem('cemetery_decedents') || '[]');
        if (decedents.length === 0) {
            decedents = [
                { id: 1, firstName: 'John', lastName: 'Smith', lotNumber: 'A-125' },
                { id: 2, firstName: 'Mary', lastName: 'Johnson', lotNumber: 'B-087' },
                { id: 3, firstName: 'Robert', lastName: 'Davis', lotNumber: 'C-234' },
                { id: 4, firstName: 'Patricia', lastName: 'Wilson', lotNumber: 'D-156' },
                { id: 5, firstName: 'Michael', lastName: 'Brown', lotNumber: 'A-089' },
                { id: 6, firstName: 'Linda', lastName: 'Martinez', lotNumber: 'B-156' }
            ];
        }
        return decedents;
    }

    // Helper: get all lots
    function getLots() {
        let lots = JSON.parse(localStorage.getItem('lots') || '[]');
        if (lots.length === 0) {
            lots = [
                { id: 1, lot_number: 'A-125', section: 'Section A', status: 'Occupied' },
                { id: 2, lot_number: 'A-089', section: 'Section A', status: 'Available' },
                { id: 3, lot_number: 'B-087', section: 'Section B', status: 'Occupied' },
                { id: 4, lot_number: 'B-156', section: 'Section B', status: 'Available' },
                { id: 5, lot_number: 'C-234', section: 'Section C', status: 'Occupied' },
                { id: 6, lot_number: 'D-001', section: 'Section D', status: 'Available' }
            ];
        }
        return lots;
    }

    // ---------- RENDER FUNCTIONS ----------
    function render() {
        updateStats();
        renderTable();
        populateDropdowns();
    }

    function updateStats() {
        const pending = relocationRequests.filter(r => r.status === 'pending').length;
        const approved = relocationRequests.filter(r => r.status === 'approved').length;
        const completed = relocationRequests.filter(r => r.status === 'completed').length;
        const total = relocationRequests.length;
        document.getElementById('pendingCount').innerText = pending;
        document.getElementById('approvedCount').innerText = approved;
        document.getElementById('completedCount').innerText = completed;
        document.getElementById('totalCount').innerText = total;
    }

    function renderTable() {
        const tbody = document.getElementById('requestsTableBody');
        if (relocationRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No relocation requests found.</td></tr>';
            return;
        }
        tbody.innerHTML = relocationRequests.map(req => `
            <tr data-id="${req.id}">
                <td>REQ-${req.id}</td>
                <td>${req.decedentName}</td>
                <td>${req.fromLotNumber}</td>
                <td>${req.toLotNumber}</td>
                <td>${req.reason.substring(0, 40)}${req.reason.length > 40 ? '...' : ''}</td>
                <td><span class="status-badge status-${req.status}">${req.status.toUpperCase()}</span></td>
                <td class="action-buttons">
                    <button class="btn-view-request" title="View Details"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
        // Attach view event listeners
        document.querySelectorAll('.btn-view-request').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const id = parseInt(row.dataset.id);
                showViewModal(id);
            });
        });
    }

    function populateDropdowns() {
        const decedents = getDecedents();
        const lots = getLots();

        // Decedent dropdown
        const decedentSelect = document.getElementById('decedentId');
        decedentSelect.innerHTML = '<option value="">Select decedent</option>' +
            decedents.map(d => `<option value="${d.id}" data-lot="${d.lotNumber || ''}">${d.firstName} ${d.lastName}</option>`).join('');

        // From Lot dropdown
        const fromLotSelect = document.getElementById('fromLotId');
        fromLotSelect.innerHTML = '<option value="">Select current lot</option>' +
            lots.map(l => `<option value="${l.id}" data-number="${l.lot_number}">${l.lot_number} (${l.section})</option>`).join('');

        // To Lot dropdown (destination)
        const toLotSelect = document.getElementById('toLotId');
        toLotSelect.innerHTML = '<option value="">Select destination lot</option>' +
            lots.map(l => `<option value="${l.id}" data-number="${l.lot_number}">${l.lot_number} (${l.section}) - ${l.status}</option>`).join('');
    }

    // ---------- MODAL FUNCTIONS ----------
    function openAddModal() {
        document.getElementById('modalTitle').innerText = 'New Relocation Request';
        document.getElementById('requestForm').reset();
        document.getElementById('requestId').value = '';
        document.getElementById('requestStatus').value = 'pending';
        document.getElementById('requestModal').style.display = 'flex';
        populateDropdowns();
    }

    function openEditModal(id) {
        const req = relocationRequests.find(r => r.id === id);
        if (!req) return;
        document.getElementById('modalTitle').innerText = 'Edit Relocation Request';
        document.getElementById('requestId').value = req.id;
        document.getElementById('decedentId').value = req.decedentId;
        document.getElementById('fromLotId').value = req.fromLotId;
        document.getElementById('toLotId').value = req.toLotId;
        document.getElementById('reason').value = req.reason;
        document.getElementById('requestStatus').value = req.status;
        document.getElementById('requestModal').style.display = 'flex';
        populateDropdowns();
    }

    function saveRequest(event) {
        event.preventDefault();
        const id = document.getElementById('requestId').value;
        const decedentId = parseInt(document.getElementById('decedentId').value);
        const fromLotId = parseInt(document.getElementById('fromLotId').value);
        const toLotId = parseInt(document.getElementById('toLotId').value);
        const reason = document.getElementById('reason').value.trim();
        const status = document.getElementById('requestStatus').value;

        // Get names and numbers from dropdowns
        const decedents = getDecedents();
        const decedent = decedents.find(d => d.id === decedentId);
        const lots = getLots();
        const fromLot = lots.find(l => l.id === fromLotId);
        const toLot = lots.find(l => l.id === toLotId);

        if (!decedent || !fromLot || !toLot) return;

        const now = new Date().toISOString().slice(0,10);

        if (id) {
            // Update existing
            const index = relocationRequests.findIndex(r => r.id == id);
            if (index !== -1) {
                relocationRequests[index] = {
                    ...relocationRequests[index],
                    decedentId, decedentName: `${decedent.firstName} ${decedent.lastName}`,
                    fromLotId, fromLotNumber: fromLot.lot_number,
                    toLotId, toLotNumber: toLot.lot_number,
                    reason, status, updatedAt: now
                };
            }
        } else {
            // Create new
            const newRequest = {
                id: nextId++,
                decedentId,
                decedentName: `${decedent.firstName} ${decedent.lastName}`,
                fromLotId,
                fromLotNumber: fromLot.lot_number,
                toLotId,
                toLotNumber: toLot.lot_number,
                reason,
                status,
                createdAt: now,
                updatedAt: now
            };
            relocationRequests.push(newRequest);
        }
        document.getElementById('requestModal').style.display = 'none';
        render();
    }

    function showViewModal(id) {
        const req = relocationRequests.find(r => r.id === id);
        if (!req) return;
        const details = `
            <div class="detail-row"><span>Request ID</span><strong>REQ-${req.id}</strong></div>
            <div class="detail-row"><span>Decedent</span><strong>${req.decedentName}</strong></div>
            <div class="detail-row"><span>From Lot</span><strong>${req.fromLotNumber}</strong></div>
            <div class="detail-row"><span>To Lot</span><strong>${req.toLotNumber}</strong></div>
            <div class="detail-row"><span>Reason</span><strong>${req.reason}</strong></div>
            <div class="detail-row"><span>Status</span><strong class="status-badge status-${req.status}">${req.status.toUpperCase()}</strong></div>
            <div class="detail-row"><span>Created</span><strong>${req.createdAt}</strong></div>
            <div class="detail-row"><span>Last Updated</span><strong>${req.updatedAt}</strong></div>
        `;
        document.getElementById('viewDetails').innerHTML = details;

        // Setup action buttons
        const approveBtn = document.getElementById('approveBtn');
        const completeBtn = document.getElementById('completeBtn');
        const denyBtn = document.getElementById('denyBtn');
        const editBtn = document.getElementById('editFromView');

        approveBtn.onclick = () => {
            if (confirm(`Approve relocation request for ${req.decedentName}?`)) {
                req.status = 'approved';
                req.updatedAt = new Date().toISOString().slice(0,10);
                render();
                document.getElementById('viewModal').style.display = 'none';
            }
        };
        completeBtn.onclick = () => {
            if (confirm(`Mark this request as completed?`)) {
                req.status = 'completed';
                req.updatedAt = new Date().toISOString().slice(0,10);
                render();
                document.getElementById('viewModal').style.display = 'none';
            }
        };
        denyBtn.onclick = () => {
            if (confirm(`Deny this relocation request?`)) {
                req.status = 'denied';
                req.updatedAt = new Date().toISOString().slice(0,10);
                render();
                document.getElementById('viewModal').style.display = 'none';
            }
        };
        editBtn.onclick = () => {
            document.getElementById('viewModal').style.display = 'none';
            openEditModal(id);
        };

        document.getElementById('viewModal').style.display = 'flex';
    }

    // ---------- EVENT LISTENERS ----------
    document.getElementById('openAddModal').addEventListener('click', openAddModal);
    document.getElementById('requestForm').addEventListener('submit', saveRequest);
    document.querySelector('.close').addEventListener('click', () => document.getElementById('requestModal').style.display = 'none');
    document.querySelector('.close-view').addEventListener('click', () => document.getElementById('viewModal').style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('requestModal')) document.getElementById('requestModal').style.display = 'none';
        if (e.target === document.getElementById('viewModal')) document.getElementById('viewModal').style.display = 'none';
    });

    // Initial render
    render();
});