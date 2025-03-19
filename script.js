// Initialize votes object
let votes = {
    yes: 0,
    maybe: 0,
    no: 0
};

// Initialize user votes array
let userVotes = [];

// Load saved votes from localStorage
function loadVotes() {
    const savedVotes = localStorage.getItem('pollVotes');
    const savedUserVotes = localStorage.getItem('userVotes');
    
    if (savedVotes) {
        votes = JSON.parse(savedVotes);
    }
    
    if (savedUserVotes) {
        userVotes = JSON.parse(savedUserVotes);
    }
}

// Save votes to localStorage
function saveVotes() {
    localStorage.setItem('pollVotes', JSON.stringify(votes));
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
}

// Get vote text in Hebrew
function getVoteText(vote) {
    const voteTexts = {
        yes: 'כן',
        maybe: 'אולי',
        no: 'לא'
    };
    return voteTexts[vote] || vote;
}

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
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    document.getElementById('totalVotes').textContent = totalVotes;

    ['yes', 'maybe', 'no'].forEach(option => {
        const percentage = totalVotes > 0 ? (votes[option] / totalVotes) * 100 : 0;
        document.getElementById(`${option}Bar`).style.width = `${percentage}%`;
        document.getElementById(`${option}Value`).textContent = `${Math.round(percentage)}%`;
    });
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

// Show thank you message
function showThankYouMessage() {
    const question = document.querySelector('.question h2');
    question.textContent = 'תודה על ההצבעה!';
    question.style.color = '#4CAF50';
}

// Share poll
function sharePoll() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('הקישור הועתק ללוח!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('לא ניתן להעתיק את הקישור. אנא העתק אותו ידנית.');
    });
}

// Update date
function updateDate() {
    const savedDate = localStorage.getItem('pollDate');
    if (savedDate) {
        const date = new Date(savedDate);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('he-IL', options);
        document.querySelector('.date').textContent = dateString;
    } else {
        document.querySelector('.date').textContent = 'לא נבחר תאריך';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadVotes();
    updateDisplay();
    updateDate();
}); 