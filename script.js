document.addEventListener('DOMContentLoaded', () => {
    const matchForm = document.getElementById('match-form');
    const matchSchedule = document.getElementById('match-schedule');
    const teamStandings = document.getElementById('team-standings');

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

    const loadStandings = () => {
        let standings = JSON.parse(localStorage.getItem('standings'));
        if (!standings) {
            standings = initializeStandings();
        }
        teamStandings.innerHTML = '';
        teams.forEach(team => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${team}</td>
                <td>${standings[team]?.points || 0}</td>
                <td>
                    <button onclick="addPoint('${team}')">+</button>
                    <button onclick="subtractPoint('${team}')">-</button>
                    <button onclick="resetPoints('${team}')">Reset Skor</button>
                </td>
            `;
            teamStandings.appendChild(row);
        });
    };

    const updateStandings = (team, points) => {
        const standings = JSON.parse(localStorage.getItem('standings')) || initializeStandings();
        if (standings[team]) {
            standings[team].points += points;
            localStorage.setItem('standings', JSON.stringify(standings));
            loadStandings();
        }
    };

    const loadMatches = () => {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
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
                <td>
                    <button onclick="deleteMatch(${index})">Hapus</button>
                    <button onclick="editMatch(${index})">Edit Skor</button>
                    <button onclick="setWO(${index})">Set WO</button>
                    <button onclick="resetMatchScore(${index})">Reset Skor</button>
                </td>
            `;
            matchSchedule.appendChild(row);
        });
    };

    window.deleteMatch = function (index) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        matches.splice(index, 1);
        localStorage.setItem('matches', JSON.stringify(matches));
        loadMatches();
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
            loadMatches();
        }
    };

    window.setWO = function (index) {
        const matches = JSON.parse(localStorage.getItem('matches')) || [];
        const match = matches[index];

        const winner = prompt(`Pilih tim yang menang WO:\n1. ${match.teamA}\n2. ${match.teamB}`, '1');
        if (winner === '1' || winner === '2') {
            match.isWO = true;
            match.winner = winner === '1' ? match.teamA : match.teamB;
            localStorage.setItem('matches', JSON.stringify(matches));

            // Update poin untuk tim yang menang WO
            updateStandings(match.winner, 1);
            loadMatches();
        }
    };

    window.resetPoints = function (team) {
        const standings = JSON.parse(localStorage.getItem('standings')) || initializeStandings();
        if (standings[team]) {
            standings[team].points = 0;
            localStorage.setItem('standings', JSON.stringify(standings));
            loadStandings();
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
            loadMatches();
        }
    };

    matchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const teamA = document.getElementById('teamA').value;
        const teamB = document.getElementById('teamB').value;
        const date = document.getElementById('date').value;
        const match = { teamA, teamB, date, score: { teamA: 0, teamB: 0 }, winner: null, isWO: false };

        let matches = JSON.parse(localStorage.getItem('matches')) || [];
        matches.push(match);
        localStorage.setItem('matches', JSON.stringify(matches));

        loadMatches();
        matchForm.reset();
    });

    loadMatches();
    loadStandings();
});
