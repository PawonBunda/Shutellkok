document.addEventListener('DOMContentLoaded', () => {
    const matchForm = document.getElementById('match-form');
    const matchSchedule = document.getElementById('match-schedule');
    const teamStandings = document.getElementById('team-standings');
    const loginForm = document.getElementById('login-form');
    const adminLoginDiv = document.getElementById('admin-login');
    const logoutButton = document.getElementById('logout-button');
    const adminOnlyElements = document.querySelectorAll('.admin-only');

    const teams = [
        "RT19 T1", "RT19 T2", "RT19 T3",
        "RT20 T1", "RT20 T2", "RT20 T3",
        "RT21 T1", "RT21 T2", "RT21 T3",
        "RT22 T1", "RT22 T2", "RT22 T3",
        "RT23 T1", "RT23 T2", "RT23 T3"
    ];

    const initializeStandings = () => {
        let standings = {};
        teams.forEach(team => {
            standings[team] = { points: 0 };
        });
        localStorage.setItem('standings', JSON.stringify(standings));
        return standings;
    };

    const loadStandings = (isAdmin) => {
        let standings = JSON.parse(localStorage.getItem('standings'));
        if (!standings) {
            standings = initializeStandings();
        }
        // Sort standings by points in descending order
        const sortedTeams = Object.keys(standings).sort((a, b) => standings[b].points - standings[a].points);

        teamStandings.innerHTML = '';
        sortedTeams.forEach(team => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${team}</td>
                <td>${standings[team]?.points || 0}</td>
                ${isAdmin ? `
                <td>
                    <button onclick="win('${team}')">Win</button>
                    <button onclick="winWO('${team}')">Win WO</button>
                    <button onclick="addPoint('${team}')">+</button>
                    <button onclick="subtractPoint('${team}')">-</button>
                    <button onclick="resetPoints('${team}')">Reset Skor</button>
                </td>` : ''}
            `;
            teamStandings.appendChild(row);
        });
    };

    const updateStandings = (team, points) => {
        const standings = JSON.parse(localStorage.getItem('standings')) || initializeStandings();
        if (standings[team]) {
            standings[team].points += points;
            localStorage.setItem('standings', JSON.stringify(standings));
            loadStandings(isAdmin());
        }
    };

    const loadMatches = (isAdmin) => {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        // Sort matches by date in descending order
        matches.sort((a, b) => new Date(b.date) - new Date(a.date));

        matchSchedule.innerHTML = '';
        matches.forEach((match, index) => {
            const scoreA = match.score?.teamA || 0;
            const scoreB = match.score?.teamB || 0;
            const winner = match.winner ? match.winner : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${match.teamA}</td>
                <td>${match.teamB}</td>
                <td>${match.date}</td>
                <td>${match.isWO ? 'WO' : `${scoreA} - ${scoreB}`}</td>
                <td>${winner}</td>
                ${isAdmin ? `
                <td>
                    <button onclick="deleteMatch(${index})">Hapus</button>
                    <button onclick="editMatch(${index})">Edit Skor</button>
                    <button onclick="setWO(${index}, '${match.teamA}')">Set WO Tim A</button>
                    <button onclick="setWO(${index}, '${match.teamB}')">Set WO Tim B</button>
                    <button onclick="resetMatchScore(${index})">Reset Skor</button>
                </td>` : ''}
            `;
            matchSchedule.appendChild(row);
        });
    };

    window.deleteMatch = function (index) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        matches.splice(index, 1);
        localStorage.setItem('matches', JSON.stringify(matches));
        loadMatches(isAdmin());
    };

    window.editMatch = function (index) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        const match = matches[index];
        const newScoreA = prompt(`Masukkan skor baru untuk ${match.teamA}:`, match.score.teamA);
        const newScoreB = prompt(`Masukkan skor baru untuk ${match.teamB}:`, match.score.teamB);

        if (newScoreA !== null && newScoreB !== null) {
            match.score.teamA = parseInt(newScoreA);
            match.score.teamB = parseInt(newScoreB);
            match.winner = match.score.teamA > match.score.teamB ? match.teamA : (match.score.teamB > match.score.teamA ? match.teamB : null);

            localStorage.setItem('matches', JSON.stringify(matches));
            loadMatches(isAdmin());
        }
    };

    window.setWO = function (index, team) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        const match = matches[index];
        
        match.isWO = true;
        match.winner = team;

        // Remove automatic update of standings here
        // updateStandings(match.winner, 1); // Remove this line

        localStorage.setItem('matches', JSON.stringify(matches));
        loadMatches(isAdmin());
    };

    window.win = function (team) {
        updateStandings(team, 3);
    };

    window.winWO = function (team) {
        updateStandings(team, 1);
    };

    window.addPoint = function (team) {
        updateStandings(team, 3);
    };

    window.subtractPoint = function (team) {
        updateStandings(team, -1);
    };

    window.resetPoints = function (team) {
        const standings = JSON.parse(localStorage.getItem('standings')) || initializeStandings();
        if (standings[team]) {
            standings[team].points = 0;
            localStorage.setItem('standings', JSON.stringify(standings));
            loadStandings(isAdmin());
        }
    };

    window.resetMatchScore = function (index) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        const match = matches[index];
        if (match) {
            match.score.teamA = 0;
            match.score.teamB = 0;
            match.winner = null;
            match.isWO = false;
            localStorage.setItem('matches', JSON.stringify(matches));
            loadMatches(isAdmin());
        }
    };

    matchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!isAdmin()) {
            alert('Hanya admin yang dapat menambahkan pertandingan!');
            return;
        }
        const teamA = document.getElementById('teamA').value;
        const teamB = document.getElementById('teamB').value;
        const date = document.getElementById('date').value;
        const match = { teamA, teamB, date, score: { teamA: 0, teamB: 0 }, winner: null, isWO: false };

        let matches = JSON.parse(localStorage.getItem('matches')) || [];
        matches.push(match);
        localStorage.setItem('matches', JSON.stringify(matches));

        loadMatches(isAdmin());
        matchForm.reset();
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const password = document.getElementById('admin-password').value;
        if (password === 'admin123') {
            localStorage.setItem('isAdmin', 'true');
            adminLoginDiv.style.display = 'none';
            logoutButton.style.display = 'block';
            adminOnlyElements.forEach(el => el.style.display = 'table-cell'); // Show admin elements
            loadMatches(true);
            loadStandings(true);
        } else {
            alert('Password salah!');
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('isAdmin');
        adminLoginDiv.style.display = 'block';
        logoutButton.style.display = 'none';
        adminOnlyElements.forEach(el => el.style.display = 'none'); // Hide admin elements
        loadMatches(false);
        loadStandings(false);
    });

    const isAdmin = () => {
        return localStorage.getItem('isAdmin') === 'true';
    };

    // Hide admin elements initially if not logged in
    if (!isAdmin()) {
        adminOnlyElements.forEach(el => el.style.display = 'none');
    }

    loadMatches(isAdmin());
    loadStandings(isAdmin());
});
