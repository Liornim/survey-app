// Initialize votes and user data from localStorage or set defaults
let votes = JSON.parse(localStorage.getItem('pollVotes')) || {
    yes: 0,
    maybe: 0,
    no: 0
};

let userVotes = JSON.parse(localStorage.getItem('userVotes')) || [];

// Set today's date as default
document.getElementById('voteDate').valueAsDate = new Date();

// Update the display with current votes
function updateDisplay() {
    const total = votes.yes + votes.maybe + votes.no;
    
    // Update total votes
    document.getElementById('totalVotes').textContent = total;
    
    // Update each option's percentage and bar
    if (total > 0) {
        updateOption('yes', votes.yes, total);
        updateOption('maybe', votes.maybe, total);
        updateOption('no', votes.no, total);
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
    const userName = document.getElementById('userName').value.trim();
    const voteDate = document.getElementById('voteDate').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 0;

    if (!userName) {
        alert('אנא הכנס את שמך');
        return;
    }

    // Update vote counts
    votes[option]++;
    
    // Add user vote to history
    userVotes.push({
        name: userName,
        date: voteDate,
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
    const userName = document.getElementById('userName').value.trim();
    const voteDate = document.getElementById('voteDate').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 0;

    if (!userName) {
        alert('אנא הכנס את שמך');
        return;
    }

    // Remove last vote from counts
    const lastVote = userVotes[userVotes.length - 1];
    if (lastVote) {
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
            <td>${vote.name}</td>
            <td>${formatDate(vote.date)}</td>
            <td>${getVoteText(vote.vote)}</td>
            <td>${vote.guests || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
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

// Share poll functionality
function sharePoll() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'סקר פשוט',
            text: 'הצטרפו לסקר שלנו!',
            url: url
        }).catch(console.error);
    } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(url).then(() => {
            alert('הקישור הועתק ללוח!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
}

// Initial display update
updateDisplay(); 