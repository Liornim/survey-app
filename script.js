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
        minyanMessage.style.fontWeight = 'bold';
        minyanMessage.style.color = '#4CAF50';
    } else {
        minyanMessage.textContent = '';
        minyanMessage.style.display = 'none';
    }
    
    // Calculate percentages based on total participants
    const yesCount = userVotes.reduce((sum, vote) => 
        sum + (vote.vote === 'yes' ? (vote.guests || 0) : 0), 0);
    const maybeCount = userVotes.reduce((sum, vote) => 
        sum + (vote.vote === 'maybe' ? (vote.guests || 0) : 0), 0);
    const noCount = userVotes.reduce((sum, vote) => 
        sum + (vote.vote === 'no' ? (vote.guests || 0) : 0), 0);

    // Update percentage bars
    if (total > 0) {
        const yesPercentage = (yesCount / total) * 100;
        const maybePercentage = (maybeCount / total) * 100;
        const noPercentage = (noCount / total) * 100;

        document.getElementById('yesBar').style.width = `${yesPercentage}%`;
        document.getElementById('maybeBar').style.width = `${maybePercentage}%`;
        document.getElementById('noBar').style.width = `${noPercentage}%`;

        document.getElementById('yesValue').textContent = `${Math.round(yesPercentage)}%`;
        document.getElementById('maybeValue').textContent = `${Math.round(maybePercentage)}%`;
        document.getElementById('noValue').textContent = `${Math.round(noPercentage)}%`;
    } else {
        document.getElementById('yesBar').style.width = '0%';
        document.getElementById('maybeBar').style.width = '0%';
        document.getElementById('noBar').style.width = '0%';

        document.getElementById('yesValue').textContent = '0%';
        document.getElementById('maybeValue').textContent = '0%';
        document.getElementById('noValue').textContent = '0%';
    }

    // Update votes table
    const votesTableBody = document.getElementById('votesTableBody');
    if (votesTableBody) {
        votesTableBody.innerHTML = '';
        userVotes.forEach(vote => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vote.email}</td>
                <td>${getVoteText(vote.vote)}</td>
                <td>${vote.guests || 1}</td>
            `;
            votesTableBody.appendChild(row);
        });
    }
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
        if (existingVote.vote === option && existingVote.guests === guestCount) {
            alert('כבר הצבעת באפשרות זו');
            return;
        }

        // Update existing vote
        const oldVote = existingVote.vote;
        const oldGuests = existingVote.guests;

        // Update vote counts
        if (oldVote !== option) {
            votes[oldVote]--;
            votes[option]++;
            existingVote.vote = option;
        }

        // Update guest count
        existingVote.guests = guestCount;

        // Save changes
        localStorage.setItem('pollVotes', JSON.stringify(votes));
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
        
        updateDisplay();

        // Show change message
        const message = oldVote !== option ? 
            `הצבעתך שונתה מ${getVoteText(oldVote)} ל${getVoteText(option)}` :
            `מספר המשתתפים עודכן מ-${oldGuests} ל-${guestCount}`;
        
        alert(message);
        return;
    }

    // New vote
    votes[option]++;
    userVotes.push({
        email: userEmail,
        vote: option,
        guests: guestCount
    });

    // Save to localStorage
    localStorage.setItem('pollVotes', JSON.stringify(votes));
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    
    updateDisplay();
    alert('תודה על ההצבעה!');
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
        const dateElement = document.querySelector('.date');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    } else {
        const dateElement = document.querySelector('.date');
        if (dateElement) {
            dateElement.textContent = 'לא נבחר תאריך';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadVotes();
    updateDisplay();
    updateDate();
}); 