// decedent-records.js – temporary in-memory storage (resets on refresh)
document.addEventListener('DOMContentLoaded', function() {
    // ---------- SESSION & AUTH ----------
    const session = JSON.parse(localStorage.getItem('cemetery_session'));
    if (!session || !session.userId) {
        window.location.href = 'login.html';
        return;
    }

    // Update user info
    document.getElementById('userName').innerText = session.fullName || session.username;
    document.getElementById('userRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    document.getElementById('sidebarUserName').innerText = session.fullName || session.username;
    document.getElementById('sidebarUserRole').innerText = session.role === 'admin' ? 'Administrator' : 'Staff';
    if (session.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('cemetery_session');
        window.location.href = 'login.html';
    });

    // ---------- TEMPORARY DECEDENT DATA (in-memory, resets on refresh) ----------
    let decedentRecords = [
        { id: 1, firstName: 'John', lastName: 'Smith', middleName: 'A', suffix: '', dob: '1945-03-15', dod: '2024-11-20', cause: 'Heart failure', lotNumber: 'A-125', section: 'Section A', contactName: 'Mary Smith', contactNumber: '09123456789', isCremated: 'no', ashStorage: '' },
        { id: 2, firstName: 'Mary', lastName: 'Johnson', middleName: 'B', suffix: '', dob: '1938-07-22', dod: '2024-12-05', cause: 'Stroke', lotNumber: 'B-087', section: 'Section B', contactName: 'Robert Johnson', contactNumber: '09234567890', isCremated: 'no', ashStorage: '' },
        { id: 3, firstName: 'Robert', lastName: 'Davis', middleName: 'C', suffix: '', dob: '1952-01-10', dod: '2025-01-15', cause: 'Cancer', lotNumber: 'C-234', section: 'Section C', contactName: 'Linda Davis', contactNumber: '09345678901', isCremated: 'no', ashStorage: '' },
        { id: 4, firstName: 'Patricia', lastName: 'Wilson', middleName: 'D', suffix: '', dob: '1941-09-30', dod: '2025-02-28', cause: 'Pneumonia', lotNumber: 'D-156', section: 'Section D', contactName: 'Michael Wilson', contactNumber: '09456789012', isCremated: 'yes', ashStorage: 'Columbarium A - Niche 12' },
        { id: 5, firstName: 'Michael', lastName: 'Brown', middleName: 'E', suffix: '', dob: '1950-05-18', dod: '2025-03-10', cause: 'Accident', lotNumber: 'A-089', section: 'Section A', contactName: 'Sarah Brown', contactNumber: '09567890123', isCremated: 'no', ashStorage: '' },
        { id: 6, firstName: 'Linda', lastName: 'Martinez', middleName: 'F', suffix: '', dob: '1955-12-08', dod: '2025-04-01', cause: 'Alzheimer\'s', lotNumber: 'B-156', section: 'Section B', contactName: 'Carlos Martinez', contactNumber: '09678901234', isCremated: 'yes', ashStorage: 'Columbarium B - Niche 5' },
    ];
    let nextId = 7;
    let currentSearchTerm = '';

    function render() {
        renderStats();
        renderTable();
    }

    function renderStats() {
        const total = decedentRecords.length;
        const burials = decedentRecords.filter(r => r.isCremated === 'no').length;
        const cremations = decedentRecords.filter(r => r.isCremated === 'yes').length;
        const ages = decedentRecords.map(r => {
            const birth = new Date(r.dob);
            const death = new Date(r.dod);
            let age = death.getFullYear() - birth.getFullYear();
            const m = death.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
            return age;
        });
        const avgAge = ages.length ? Math.round(ages.reduce((a,b)=>a+b,0) / ages.length) : 0;
        document.getElementById('totalCount').innerText = total;
        document.getElementById('burialCount').innerText = burials;
        document.getElementById('cremationCount').innerText = cremations;
        document.getElementById('avgAge').innerText = avgAge;
    }

    function renderTable() {
        const tbody = document.getElementById('tableBody');
        let filtered = [...decedentRecords];
        if (currentSearchTerm.trim() !== '') {
            const term = currentSearchTerm.toLowerCase();
            filtered = filtered.filter(r => 
                r.firstName.toLowerCase().includes(term) ||
                r.lastName.toLowerCase().includes(term) ||
                `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) ||
                r.lotNumber.toLowerCase().includes(term) ||
                `D-${r.id}`.includes(term)
            );
        }
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No records found.</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(rec => `
            <tr data-id="${rec.id}">
                <td>D-${rec.id}</td>
                <td>${rec.firstName} ${rec.lastName} ${rec.suffix}</td>
                <td>${rec.dob}</td>
                <td>${rec.dod}</td>
                <td>${rec.lotNumber}</td>
                <td>${rec.section}</td>
                <td class="action-buttons">
                    <button class="btn-view" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit-row" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="btn-delete-row" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        attachTableButtons();
    }

    function attachTableButtons() {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const id = parseInt(row.dataset.id);
                showViewModal(id);
            });
        });
        document.querySelectorAll('.btn-edit-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const id = parseInt(row.dataset.id);
                openEditModal(id);
            });
        });
        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                const id = parseInt(row.dataset.id);
                if (confirm('Delete this record? This action is temporary and will revert on page refresh.')) {
                    decedentRecords = decedentRecords.filter(r => r.id !== id);
                    render();
                }
            });
        });
    }

    document.getElementById('searchInput').addEventListener('input', function(e) {
        currentSearchTerm = e.target.value;
        renderTable();
    });

    function populateLotDropdown() {
        const lotSelect = document.getElementById('lotNumber');
        let lots = JSON.parse(localStorage.getItem('lots') || '[]');
        if (lots.length === 0) {
            lots = [
                { lot_number: 'A-125', section: 'Section A' }, { lot_number: 'B-087', section: 'Section B' },
                { lot_number: 'C-234', section: 'Section C' }, { lot_number: 'D-156', section: 'Section D' },
                { lot_number: 'A-089', section: 'Section A' }, { lot_number: 'B-156', section: 'Section B' }
            ];
        }
        lotSelect.innerHTML = '<option value="">Select a lot</option>' + lots.map(l => `<option value="${l.lot_number}" data-section="${l.section}">${l.lot_number} (${l.section})</option>`).join('');
        lotSelect.addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            const section = selected.getAttribute('data-section');
            if (section) document.getElementById('section').value = section;
        });
    }
    populateLotDropdown();

    document.getElementById('isCremated').addEventListener('change', function() {
        const ashGroup = document.getElementById('ashStorageGroup');
        ashGroup.style.display = this.value === 'yes' ? 'block' : 'none';
    });

    let currentEditId = null;

    function openAddModal() {
        currentEditId = null;
        document.getElementById('modalTitle').innerText = 'Add Decedent Record';
        document.getElementById('recordForm').reset();
        document.getElementById('recordId').value = '';
        document.getElementById('ashStorageGroup').style.display = 'none';
        document.getElementById('recordModal').style.display = 'flex';
    }

    function openEditModal(id) {
        const rec = decedentRecords.find(r => r.id === id);
        if (!rec) return;
        currentEditId = id;
        document.getElementById('modalTitle').innerText = 'Edit Decedent Record';
        document.getElementById('recordId').value = rec.id;
        document.getElementById('firstName').value = rec.firstName;
        document.getElementById('lastName').value = rec.lastName;
        document.getElementById('middleName').value = rec.middleName || '';
        document.getElementById('suffix').value = rec.suffix || '';
        document.getElementById('dob').value = rec.dob;
        document.getElementById('dod').value = rec.dod;
        document.getElementById('cause').value = rec.cause || '';
        document.getElementById('lotNumber').value = rec.lotNumber;
        document.getElementById('section').value = rec.section;
        document.getElementById('contactName').value = rec.contactName || '';
        document.getElementById('contactNumber').value = rec.contactNumber || '';
        document.getElementById('isCremated').value = rec.isCremated;
        document.getElementById('ashStorage').value = rec.ashStorage || '';
        const ashGroup = document.getElementById('ashStorageGroup');
        ashGroup.style.display = rec.isCremated === 'yes' ? 'block' : 'none';
        document.getElementById('recordModal').style.display = 'flex';
    }

    function saveRecord(event) {
        event.preventDefault();
        const id = document.getElementById('recordId').value;
        const newRecord = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            middleName: document.getElementById('middleName').value.trim(),
            suffix: document.getElementById('suffix').value.trim(),
            dob: document.getElementById('dob').value,
            dod: document.getElementById('dod').value,
            cause: document.getElementById('cause').value.trim(),
            lotNumber: document.getElementById('lotNumber').value,
            section: document.getElementById('section').value,
            contactName: document.getElementById('contactName').value.trim(),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            isCremated: document.getElementById('isCremated').value,
            ashStorage: document.getElementById('ashStorage').value.trim(),
        };
        if (id) {
            const index = decedentRecords.findIndex(r => r.id == id);
            if (index !== -1) {
                decedentRecords[index] = { ...decedentRecords[index], ...newRecord, id: parseInt(id) };
            }
        } else {
            newRecord.id = nextId++;
            decedentRecords.push(newRecord);
        }
        document.getElementById('recordModal').style.display = 'none';
        render();
    }

    function showViewModal(id) {
        const rec = decedentRecords.find(r => r.id === id);
        if (!rec) return;
        const details = `
            <div class="detail-row"><span>Full Name</span><strong>${rec.firstName} ${rec.lastName} ${rec.suffix}</strong></div>
            <div class="detail-row"><span>Date of Birth</span><strong>${rec.dob}</strong></div>
            <div class="detail-row"><span>Date of Death</span><strong>${rec.dod}</strong></div>
            <div class="detail-row"><span>Cause of Death</span><strong>${rec.cause || '—'}</strong></div>
            <div class="detail-row"><span>Lot Number</span><strong>${rec.lotNumber}</strong></div>
            <div class="detail-row"><span>Section</span><strong>${rec.section}</strong></div>
            <div class="detail-row"><span>Contact Name</span><strong>${rec.contactName || '—'}</strong></div>
            <div class="detail-row"><span>Contact Number</span><strong>${rec.contactNumber || '—'}</strong></div>
            <div class="detail-row"><span>Cremated?</span><strong>${rec.isCremated === 'yes' ? 'Yes' : 'No'}</strong></div>
            ${rec.isCremated === 'yes' ? `<div class="detail-row"><span>Ash Storage</span><strong>${rec.ashStorage || '—'}</strong></div>` : ''}
        `;
        document.getElementById('viewDetails').innerHTML = details;
        const modal = document.getElementById('viewModal');
        modal.style.display = 'flex';
        document.getElementById('editFromView').onclick = () => {
            modal.style.display = 'none';
            openEditModal(id);
        };
    }

    document.getElementById('openAddModal').addEventListener('click', openAddModal);
    document.getElementById('recordForm').addEventListener('submit', saveRecord);
    document.querySelector('.close').addEventListener('click', () => document.getElementById('recordModal').style.display = 'none');
    document.querySelector('.close-view').addEventListener('click', () => document.getElementById('viewModal').style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('recordModal')) document.getElementById('recordModal').style.display = 'none';
        if (e.target === document.getElementById('viewModal')) document.getElementById('viewModal').style.display = 'none';
    });

    render();
});