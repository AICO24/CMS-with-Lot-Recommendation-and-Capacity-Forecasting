// burial-scheduling.js – temporary in-memory storage, AI recommendation simulation
document.addEventListener('DOMContentLoaded', function() {
    // Session check
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

    // Get lots from localStorage (or use demo)
    let lots = JSON.parse(localStorage.getItem('lots') || '[]');
    if (lots.length === 0) {
        lots = [
            { lot_id: 1, lot_number: 'A-001', section: 'Section A', type: 'Lawn Lot', price: 5500, status: 'Available' },
            { lot_id: 2, lot_number: 'A-002', section: 'Section A', type: 'Lawn Lot', price: 5800, status: 'Available' },
            { lot_id: 3, lot_number: 'B-001', section: 'Section B', type: 'Family Lot', price: 8500, status: 'Available' },
            { lot_id: 4, lot_number: 'B-002', section: 'Section B', type: 'Family Lot', price: 8200, status: 'Reserved' },
            { lot_id: 5, lot_number: 'C-001', section: 'Section C', type: 'Mausoleum', price: 12500, status: 'Available' },
            { lot_id: 6, lot_number: 'D-001', section: 'Section D', type: 'Cremation Niche', price: 3500, status: 'Available' },
        ];
        localStorage.setItem('lots', JSON.stringify(lots));
    }

    // Temporary storage for current schedule (resets on refresh)
    let currentPreferences = {};
    let selectedLot = null;
    let schedules = []; // in-memory, not persisted

    // Budget slider display
    const budgetSlider = document.getElementById('prefBudget');
    const budgetValue = document.getElementById('budgetValue');
    budgetSlider.addEventListener('input', () => {
        budgetValue.textContent = budgetSlider.value;
    });

    // Step navigation
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    function showStep(stepNumber) {
        stepContents.forEach((content, idx) => {
            content.classList.toggle('active', idx + 1 === stepNumber);
        });
        steps.forEach((step, idx) => {
            step.classList.toggle('active', idx + 1 === stepNumber);
        });
    }

    // Step 1: Submit preferences
    document.getElementById('preferencesForm').addEventListener('submit', (e) => {
        e.preventDefault();
        currentPreferences = {
            lotType: document.getElementById('prefLotType').value,
            budget: parseInt(budgetSlider.value),
            section: document.getElementById('prefSection').value,
            date: document.getElementById('prefDate').value,
            notes: document.getElementById('prefNotes').value
        };
        // Validate date
        if (!currentPreferences.date) {
            alert('Please select a burial date.');
            return;
        }
        // Generate AI recommendations
        generateRecommendations();
        showStep(2);
    });

    function generateRecommendations() {
        // Filter available lots
        let available = lots.filter(l => l.status === 'Available');
        // Filter by lot type if specified
        if (currentPreferences.lotType) {
            available = available.filter(l => l.type === currentPreferences.lotType);
        }
        // Filter by budget
        available = available.filter(l => l.price <= currentPreferences.budget);
        // Filter by section if specified
        if (currentPreferences.section) {
            available = available.filter(l => l.section === currentPreferences.section);
        }
        // Simple scoring: lower price = higher suitability (for demo)
        const scored = available.map(lot => ({
            ...lot,
            score: Math.min(95, Math.round((1 - (lot.price / currentPreferences.budget)) * 60 + 30))
        })).sort((a,b) => b.score - a.score);
        const top3 = scored.slice(0, 3);
        const container = document.getElementById('recommendationsList');
        if (top3.length === 0) {
            container.innerHTML = '<p class="text-center">No matching lots available. Please adjust your preferences.</p>';
            return;
        }
        container.innerHTML = top3.map(lot => `
            <div class="recommendation-card" data-lot-id="${lot.lot_id}">
                <div>
                    <strong>${lot.lot_number} — ${lot.section}</strong><br>
                    <span class="lot-type-tag">${lot.type}</span> | Price: $${lot.price.toLocaleString()}
                </div>
                <div class="score">${lot.score}% suitability</div>
                <button class="select-lot-btn" data-lot='${JSON.stringify(lot)}'>Select</button>
            </div>
        `).join('');
        // Attach select handlers
        document.querySelectorAll('.select-lot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lot = JSON.parse(btn.getAttribute('data-lot'));
                selectedLot = lot;
                displayConfirmation(lot);
                showStep(3);
            });
        });
    }

    function displayConfirmation(lot) {
        const details = `
            <div class="confirmation-box">
                <p><strong>Lot:</strong> ${lot.lot_number} (${lot.section})</p>
                <p><strong>Type:</strong> ${lot.type}</p>
                <p><strong>Price:</strong> $${lot.price.toLocaleString()}</p>
                <p><strong>Burial Date:</strong> ${currentPreferences.date}</p>
                <p><strong>Additional Notes:</strong> ${currentPreferences.notes || 'None'}</p>
            </div>
        `;
        document.getElementById('confirmationDetails').innerHTML = details;
    }

    // Back buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseInt(btn.getAttribute('data-back'));
            showStep(step);
        });
    });

    // Confirm booking
    document.getElementById('confirmBooking').addEventListener('click', () => {
        if (!selectedLot) {
            alert('No lot selected.');
            return;
        }
        // Create schedule record (temporary, resets on refresh)
        const newSchedule = {
            schedule_id: schedules.length + 1,
            lot_id: selectedLot.lot_id,
            lot_number: selectedLot.lot_number,
            burial_date: currentPreferences.date,
            status: 'Confirmed',
            created_by: session.userId,
            created_at: new Date().toISOString()
        };
        schedules.push(newSchedule);
        // Update lot status in memory (temporary)
        const lotIndex = lots.findIndex(l => l.lot_id === selectedLot.lot_id);
        if (lotIndex !== -1) {
            lots[lotIndex].status = 'Reserved';
            localStorage.setItem('lots', JSON.stringify(lots));
        }
        alert('Schedule confirmed! Lot has been reserved.');
        // Reset form and go to step 1 (or stay on confirmation)
        document.getElementById('preferencesForm').reset();
        budgetValue.textContent = '10000';
        budgetSlider.value = '10000';
        currentPreferences = {};
        selectedLot = null;
        showStep(1);
    });

    // Step indicator clicks (optional navigation)
    steps.forEach(step => {
        step.addEventListener('click', () => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            if (stepNum === 1) showStep(1);
            // Prevent skipping steps if preferences not set
            if (stepNum === 2 && !currentPreferences.date) {
                alert('Please fill preferences first.');
                return;
            }
            if (stepNum === 3 && !selectedLot) {
                alert('Please select a lot from recommendations first.');
                return;
            }
            showStep(stepNum);
        });
    });

    // Set today's date as min for burial date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('prefDate').setAttribute('min', today);
});