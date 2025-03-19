// Initialize poll data
let votes = { yes: 0, maybe: 0, no: 0 };
let userVotes = [];

// Function to get vote text
function getVoteText(vote) {
    const voteTexts = {
        yes: 'כן',
        maybe: 'אולי',
        no: 'לא'
    };
    return voteTexts[vote] || vote;
}

// Function to validate email
function validateEmail(email) {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'כתובת האימייל אינה תקינה';
    }

    // Check for minimum length
    const [localPart] = email.split('@');
    if (localPart.length < 3) {
        return 'כתובת האימייל קצרה מדי';
    }

    // List of allowed email domains
    const allowedDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'aol.com',
        'icloud.com',
        'protonmail.com',
        'walla.co.il',
        'walla.com',
        '012.net.il',
        'bezeqint.net',
        'netvision.net.il'
    ];

    const domain = email.split('@')[1].toLowerCase();
    if (!allowedDomains.includes(domain)) {
        return 'נא להשתמש בשירות אימייל מוכר (gmail, yahoo וכו\')';
    }

    // Check for inappropriate language in local part
    const inappropriateWords = [
        'shit', 'fuck', 'ass', 'bitch', 'cunt', 'dick', 'pussy', 'whore',
        'חרא', 'זין', 'כוס', 'תחת', 'זונה', 'מזדיין', 'מזדיינת'
    ];

    const lowerEmail = email.toLowerCase();
    for (const word of inappropriateWords) {
        if (lowerEmail.includes(word)) {
            return 'כתובת האימייל מכילה תוכן לא הולם';
        }
    }

    return null; // Email is valid
}

// Function to update the display
function updateDisplay() {
    // Update vote counts
    document.getElementById('yesValue').textContent = `${votes.yes}%`;
    document.getElementById('maybeValue').textContent = `${votes.maybe}%`;
    document.getElementById('noValue').textContent = `${votes.no}%`;

    // Update bars
    const totalVotes = votes.yes + votes.maybe + votes.no;
    if (totalVotes > 0) {
        document.getElementById('yesBar').style.width = `${(votes.yes / totalVotes) * 100}%`;
        document.getElementById('maybeBar').style.width = `${(votes.maybe / totalVotes) * 100}%`;
        document.getElementById('noBar').style.width = `${(votes.no / totalVotes) * 100}%`;
    }

    // Update votes table
    const tableBody = document.getElementById('votesTableBody');
    tableBody.innerHTML = '';
    userVotes.forEach(vote => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vote.email}</td>
            <td>${getVoteText(vote.vote)}</td>
            <td>${vote.guests}</td>
        `;
        tableBody.appendChild(row);
    });

    // Update total participants
    const totalParticipants = userVotes.reduce((sum, vote) => sum + vote.guests, 0);
    document.getElementById('totalParticipants').textContent = totalParticipants;

    // Update minyan message
    const minyanMessage = document.getElementById('minyanMessage');
    if (totalParticipants > 5) {
        minyanMessage.textContent = 'יש מניין';
        minyanMessage.style.display = 'block';
    } else {
        minyanMessage.style.display = 'none';
    }
}

// Function to load poll data
async function loadPollData() {
    try {
        // First try to load from localStorage
        const savedData = localStorage.getItem('pollData');
        if (savedData) {
            const data = JSON.parse(savedData);
            votes = data.votes;
            userVotes = data.userVotes;
            updateDisplay();
        }

        // Then try to load from GitHub
        const response = await fetch('https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/survey-app/main/votes.json');
        if (response.ok) {
            const data = await response.json();
            votes = data.votes;
            userVotes = data.userVotes;
            updateDisplay();
            // Update localStorage with latest data
            localStorage.setItem('pollData', JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error loading poll data:', error);
    }
}

// Function to save vote
async function saveVote(email, vote, guests) {
    try {
        // Get current data from localStorage
        const savedData = localStorage.getItem('pollData');
        const data = savedData ? JSON.parse(savedData) : { votes: { yes: 0, maybe: 0, no: 0 }, userVotes: [] };
        
        // Check if email already voted
        const existingVoteIndex = data.userVotes.findIndex(v => v.email === email);
        
        if (existingVoteIndex !== -1) {
            // Update existing vote
            const oldVote = data.userVotes[existingVoteIndex].vote;
            data.votes[oldVote]--;
            data.votes[vote]++;
            data.userVotes[existingVoteIndex] = { email, vote, guests };
        } else {
            // Add new vote
            data.votes[vote]++;
            data.userVotes.push({ email, vote, guests });
        }

        // Save to localStorage
        localStorage.setItem('pollData', JSON.stringify(data));

        // Try to save to GitHub
        try {
            const response = await fetch('https://api.github.com/repos/YOUR_GITHUB_USERNAME/survey-app/contents/votes.json', {
                method: 'PUT',
                headers: {
                    'Authorization': 'token YOUR_GITHUB_TOKEN',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update votes',
                    content: btoa(JSON.stringify(data, null, 2))
                })
            });

            if (!response.ok) {
                console.error('Failed to save to GitHub, but vote is saved locally');
            }
        } catch (error) {
            console.error('Error saving to GitHub, but vote is saved locally:', error);
        }

        return true;
    } catch (error) {
        console.error('Error saving vote:', error);
        throw error;
    }
}

// Handle voting
async function vote(option) {
    const userEmail = document.getElementById('userEmail').value.trim().toLowerCase();
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;

    if (!userEmail) {
        alert('נא להזין אימייל');
        return;
    }

    // Validate email
    const emailError = validateEmail(userEmail);
    if (emailError) {
        alert(emailError);
        return;
    }

    try {
        // Save vote
        await saveVote(userEmail, option, guestCount);
        
        // Reload data to update display
        loadPollData();
        
        alert('תודה על ההצבעה!');
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('שגיאה בשליחת ההצבעה: ' + error.message);
    }
}

// Share poll function
function sharePoll() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('הקישור הועתק ללוח!');
    }).catch(err => {
        console.error('Error copying link:', err);
        alert('שגיאה בהעתקת הקישור');
    });
}

// Update date
function updateDate() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.date').textContent = date.toLocaleDateString('he-IL', options);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    loadPollData();
    // Refresh poll data every 5 seconds
    setInterval(loadPollData, 5000);
}); 