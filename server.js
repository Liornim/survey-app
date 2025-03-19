const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Data file path
const dataFile = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
        votes: { yes: 0, maybe: 0, no: 0 },
        userVotes: []
    }));
}

// Routes
app.get('/api/poll-data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dataFile));
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Error reading data' });
    }
});

app.post('/api/vote', (req, res) => {
    try {
        const { email, vote, guests } = req.body;
        const data = JSON.parse(fs.readFileSync(dataFile));
        
        // Find existing vote
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
        
        // Save updated data
        fs.writeFileSync(dataFile, JSON.stringify(data));
        res.json(data);
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).json({ error: 'Error saving vote' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 