// Initialize votes and user data from localStorage or set defaults
let votes = JSON.parse(localStorage.getItem('pollVotes')) || {
    yes: 0,
    maybe: 0,
    no: 0
};

let userVotes = JSON.parse(localStorage.getItem('userVotes')) || [];
let pollDate = localStorage.getItem('pollDate') || new Date().toISOString().split('T')[0];

// Set current date in header
document.getElementById('currentDate').textContent = new Date(pollDate).toLocaleDateString('he-IL');

// Update the display with current votes
function updateDisplay() {
    const total = userVotes.reduce((sum, vote) => sum + (vote.guests || 0), 0);
    const totalYes = userVotes.reduce((sum, vote) => 
        sum + (vote.vote === 'yes' ? (vote.guests || 0) : 0), 0);
    
    // Update totals in header
    document.getElementById('totalParticipants').textContent = total;

    // Update minyan message - only count yes votes
    const minyanMessage = document.getElementById('minyanMessage');
    if (totalYes > 5) {
        minyanMessage.textContent = 'יש מניין';
        minyanMessage.style.display = 'block';
    } else {
        minyanMessage.textContent = '';
        minyanMessage.style.display = 'none';
    }
    
    // Update each option's percentage and bar
    if (votes.yes + votes.maybe + votes.no > 0) {
        updateOption('yes', votes.yes, votes.yes + votes.maybe + votes.no);
        updateOption('maybe', votes.maybe, votes.yes + votes.maybe + votes.no);
        updateOption('no', votes.no, votes.yes + votes.maybe + votes.no);
    }

    // Update results table
    updateResultsTable();
}

// Update individual option display
function updateOption(option, count, total) {
    const percentage = (count / total) * 100;
    document.getElementById(`${option}Bar`).style.width = `${percentage}%`;
    document.getElementById(`${option}Value`).textContent = `${Math.round(percentage)}%`;
}

// Handle voting
function vote(option) {
    const userEmail = document.getElementById('userEmail').value.trim().toLowerCase();
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail) {
        alert('אנא הכנס את האימייל שלך');
        return;
    }
    if (!emailRegex.test(userEmail)) {
        alert('אנא הכנס כתובת אימייל תקינה');
        return;
    }

    // Check if email has already voted
    const existingVote = userVotes.find(vote => vote.email === userEmail);
    if (existingVote) {
        // If the vote is the same, just update the guest count
        if (existingVote.vote === option) {
            existingVote.guests = guestCount;
            localStorage.setItem('userVotes', JSON.stringify(userVotes));
            updateDisplay();
            
            // Show update message
            const question = document.querySelector('.question h2');
            question.textContent = `מספר המשתתפים עודכן ל-${guestCount}`;
            question.style.color = '#FF9800';
            
            // Reset message after 3 seconds
            setTimeout(() => {
                question.textContent = 'תודה על העדכון!';
                question.style.color = '#4CAF50';
            }, 3000);
            return;
        }
        
        // Ask if user wants to change their vote
        if (confirm('כבר הצבעת בסקר זה. האם תרצה לשנות את ההצבעה שלך?')) {
            // If voting differently, update the vote
            const oldVote = existingVote.vote;
            votes[oldVote]--;
            votes[option]++;
            
            // Update the existing vote
            existingVote.vote = option;
            existingVote.guests = guestCount;
            
            // Save to localStorage
            localStorage.setItem('pollVotes', JSON.stringify(votes));
            localStorage.setItem('userVotes', JSON.stringify(userVotes));
            
            updateDisplay();
            
            // Show change message
            const question = document.querySelector('.question h2');
            question.textContent = `הצבעתך שונתה מ-${getVoteText(oldVote)} ל-${getVoteText(option)}`;
            question.style.color = '#FF9800';
            
            // Reset message after 3 seconds
            setTimeout(() => {
                question.textContent = 'תודה על ההצבעה!';
                question.style.color = '#4CAF50';
            }, 3000);
        }
        return;
    }

    // New vote
    votes[option]++;
    
    // Add user vote to history
    userVotes.push({
        email: userEmail,
        vote: option,
        guests: guestCount
    });

    // Save to localStorage
    localStorage.setItem('pollVotes', JSON.stringify(votes));
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    
    updateDisplay();
    
    // Disable buttons after voting
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });

    // Show change vote button
    document.getElementById('changeVoteSection').style.display = 'block';
    
    // Show thank you message
    showThankYouMessage();
}

// Reset vote
function resetVote() {
    const userEmail = document.getElementById('userEmail').value.trim().toLowerCase();
    const guestCount = parseInt(document.getElementById('guestCount').value) || 0;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userEmail) {
        alert('אנא הכנס את האימייל שלך');
        return;
    }
    if (!emailRegex.test(userEmail)) {
        alert('אנא הכנס כתובת אימייל תקינה');
        return;
    }

    // Remove last vote from counts
    const lastVote = userVotes[userVotes.length - 1];
    if (lastVote && lastVote.email === userEmail) {
        votes[lastVote.vote]--;
        userVotes.pop();
        
        // Save updated data
        localStorage.setItem('pollVotes', JSON.stringify(votes));
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
        
        // Reset UI
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
        
        document.getElementById('changeVoteSection').style.display = 'none';
        document.querySelector('.question h2').textContent = 'האם אתה מסכים?';
        document.querySelector('.question h2').style.color = '#444';
        
        updateDisplay();
    }
}

// Update results table
function updateResultsTable() {
    const tbody = document.getElementById('votesTableBody');
    tbody.innerHTML = '';
    
    userVotes.forEach(vote => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${vote.email}</td>
            <td>${getVoteText(vote.vote)}</td>
            <td>${vote.guests || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Get vote text in Hebrew
function getVoteText(vote) {
    const voteTexts = {
        yes: 'כן',
        maybe: 'אולי',
        no: 'לא'
    };
    return voteTexts[vote];
}

// Show thank you message
function showThankYouMessage() {
    const question = document.querySelector('.question h2');
    question.textContent = 'תודה על ההצבעה!';
    question.style.color = '#4CAF50';
}

// Initial display update
updateDisplay(); 