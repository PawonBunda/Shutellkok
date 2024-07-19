document.addEventListener('DOMContentLoaded', () => {
    const matchForm = document.getElementById('match-form');
    const matchSchedule = document.getElementById('match-schedule').querySelector('tbody');
    const teamStandings = document.getElementById('team-standings').querySelector('tbody');
    const loginForm = document.getElementById('login-form');
    const adminLoginDiv = document.getElementById('admin-login');
    const logoutButton = document.getElementById('logout-button');
    const adminOnlyElements = document.querySelectorAll('.admin-only');

    const db = firebase.database();
    const matchesRef = db.ref('matches');
    const standingsRef = db.ref('standings');

    const initializeStandings = () => {
        const teams = [
            "RT19 T1", "RT19 T2", "RT19 T3",
            "RT20 T1", "RT20 T2", "RT20 T3",
            "RT21 T1", "RT21 T2", "RT21 T3",
            "RT22 T1", "RT22 T2", "RT22 T3",
            "RT23 T1", "RT23 T2", "RT23 T3"
        ];
        const standings = {};
        teams.forEach(team => {
            standings[team] = { points: 0 };
        });
        standingsRef.set(standings);
    };

    const loadStandings = (isAdmin) => {
        standingsRef.once('value').then(snapshot => {
            let standings = snapshot.val();
            if (!standings) {
                initializeStandings();
                standings = snapshot.val();
            }

            // Sort standings by points in descending order
            const sortedTeams = Object.keys(standings).sort((a, b) => standings[b].points - standings[a].points);

            teamStandings.innerHTML = '';
            sortedTeams.forEach(team => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${team}</td>
                    <td>${standings[team].points || 0}</td>
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
        });
    };

    const updateStandings = (team, points) => {
        standingsRef.once('value').then(snapshot => {
            let standings = snapshot.val();
            if (!standings) {
                initializeStandings();
                standings = snapshot.val();
            }
            if (standings[team]) {
                standings[team].points += points;
                standingsRef.set(standings);
                loadStandings(isAdmin());
            }
        });
    };

    const loadMatches = (isAdmin) => {
        matchesRef.once('value').then(snapshot => {
            const matches = snapshot.val() || [];
            // Sort matches by date in descending order
            const sortedMatches = Object.values(matches).sort((a, b) => new Date(b.date) - new Date(a.date));

            matchSchedule.innerHTML = '';
            sortedMatches.forEach((match, index) => {
                const score = match.score || '';
                const winner = match.winner || '';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${match.teamA}</td>
                    <td>${match.teamB}</td>
                    <td>${match.date}</td>
                    <td>${score}</td>
                    <td>${winner}</td>
                    ${isAdmin ? `
                    <td>
                        <button onclick="editMatch(${index})">Edit</button>
                        <button onclick="deleteMatch(${index})">Delete</button>
                        <button onclick="setWO(${index})">Set WO</button>
                    </td>` : ''}
                `;
                matchSchedule.appendChild(row);
            });
        });
    };

    const isAdmin = () => {
        return localStorage.getItem('adminLoggedIn') === 'true';
    };

    const loginAdmin = (password) => {
        if (password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            toggleAdminUI(true);
        } else {
            alert('Password salah!');
        }
    };

    const logoutAdmin = () => {
        localStorage.removeItem('adminLoggedIn');
        toggleAdminUI(false);
    };

    const toggleAdminUI = (isAdmin) => {
        document.getElementById('admin-login').style.display = isAdmin ? 'none' : 'block';
        document.getElementById('logout-button').style.display = isAdmin ? 'block' : 'none';
        adminOnlyElements.forEach(element => element.style.display = isAdmin ? 'table-cell' : 'none');
        loadMatches(isAdmin);
        loadStandings(isAdmin);
    };

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const password = document.getElementById('admin-password').value;
        loginAdmin(password);
    });

    logoutButton.addEventListener('click', logoutAdmin);

    matchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const teamA = document.getElementById('teamA').value;
        const teamB = document.getElementById('teamB').value;
        const date = document.getElementById('date').value;

        const newMatchRef = matchesRef.push();
        newMatchRef.set({
            teamA: teamA,
            teamB: teamB,
            date: date,
            score: '',
            winner: ''
        });

        document.getElementById('teamA').value = '';
        document.getElementById('teamB').value = '';
        document.getElementById('date').value = '';
    });

    window.win = (team) => {
        updateStandings(team, 3);
    };

    window.winWO = (team) => {
        updateStandings(team, 1);
    };

    window.addPoint = (team) => {
        updateStandings(team, 1);
    };

    window.subtractPoint = (team) => {
        updateStandings(team, -1);
    };

    window.resetPoints = (team) => {
        updateStandings(team, -1 * (teamStandings.querySelector(`td:contains('${team}') + td`).textContent));
    };

    window.editMatch = (index) => {
        // Function to edit match details
    };

    window.deleteMatch = (index) => {
        matchesRef.once('value').then(snapshot => {
            const matches = snapshot.val();
            if (matches) {
                const matchKey = Object.keys(matches)[index];
                matchesRef.child(matchKey).remove();
            }
        });
    };

    window.setWO = (index) => {
        // Function to set match as WO
    };

    toggleAdminUI(isAdmin());
});
