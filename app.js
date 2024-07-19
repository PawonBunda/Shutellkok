// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKgWd-2POsEJVgixJEPsvfz7hGjHyxSgo",
  authDomain: "pbcup006.firebaseapp.com",
  projectId: "pbcup006",
  storageBucket: "pbcup006.appspot.com",
  messagingSenderId: "139943219655",
  appId: "1:139943219655:web:b81a5c1235ee9c5aee09e2",
  measurementId: "G-84X37DL6C6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

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

    const initializeStandings = async () => {
        let standings = {};
        teams.forEach(team => {
            standings[team] = { points: 0 };
        });
        await setDoc(doc(db, "standings", "data"), standings);
        return standings;
    };

    const loadStandings = async (isAdmin) => {
        const standingsRef = doc(db, "standings", "data");
        const docSnap = await getDocs(standingsRef);
        let standings = docSnap.exists() ? docSnap.data() : await initializeStandings();

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

    const updateStandings = async (team, points) => {
        const standingsRef = doc(db, "standings", "data");
        const standings = (await getDocs(standingsRef)).data() || await initializeStandings();
        if (standings[team]) {
            standings[team].points += points;
            await setDoc(standingsRef, standings);
            loadStandings(isAdmin());
        }
    };

    const loadMatches = async (isAdmin) => {
        const matchesRef = collection(db, "matches");
        const querySnapshot = await getDocs(matchesRef);
        let matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
                    <button onclick="deleteMatch('${match.id}')">Hapus</button>
                    <button onclick="editMatch('${match.id}')">Edit Skor</button>
                    <button onclick="setWO('${match.id}', '${match.teamA}')">Set WO Tim A</button>
                    <button onclick="setWO('${match.id}', '${match.teamB}')">Set WO Tim B</button>
                    <button onclick="resetMatchScore('${match.id}')">Reset Skor</button>
                </td>` : ''}
            `;
            matchSchedule.appendChild(row);
        });
    };

    window.deleteMatch = async function (id) {
        await deleteDoc(doc(db, "matches", id));
        loadMatches(isAdmin());
    };

    window.editMatch = async function (id) {
        const matchRef = doc(db, "matches", id);
        const matchSnap = await getDocs(matchRef);
        const match = matchSnap.data();
        const newScoreA = prompt(`Masukkan skor baru untuk ${match.teamA}:`, match.score.teamA);
        const newScoreB = prompt(`Masukkan skor baru untuk ${match.teamB}:`, match.score.teamB);

        if (newScoreA !== null && newScoreB !== null) {
            match.score.teamA = parseInt(newScoreA);
            match.score.teamB = parseInt(newScoreB);
            match.winner = match.score.teamA > match.score.teamB ? match.teamA : (match.score.teamB > match.score.teamA ? match.teamB : null);

            await setDoc(matchRef, match);
            loadMatches(isAdmin());
        }
    };

    window.setWO = async function (id, team) {
        const matchRef = doc(db, "matches", id);
        const matchSnap = await getDocs(matchRef);
        const match = matchSnap.data();

        match.isWO = true;
        match.winner = team;

        // Remove automatic update of standings here
        // await updateStandings(match.winner, 1); // Remove this line

        await setDoc(matchRef, match);
        loadMatches(isAdmin());
    };

    window.win = async function (team) {
        await updateStandings(team, 3);
    };

    window.winWO = async function (team) {
        await updateStandings(team, 1);
    };

    window.addPoint = async function (team) {
        await updateStandings(team, 3);
    };

    window.subtractPoint = async function (team) {
        await updateStandings(team, -1);
    };

    window.resetPoints = async function (team) {
        const standingsRef = doc(db, "standings", "data");
        const standings = (await getDocs(standingsRef)).data() || await initializeStandings();
        if (standings[team]) {
            standings[team].points = 0;
            await setDoc(standingsRef, standings);
            loadStandings(isAdmin());
        }
    };

    window.resetMatchScore = async function (id) {
        const matchRef = doc(db, "matches", id);
        const matchSnap = await getDocs(matchRef);
        const match = matchSnap.data();
        if (match) {
            match.score.teamA = 0;
            match.score.teamB = 0;
            match.winner = null;
            match.isWO = false;
            await setDoc(matchRef, match);
            loadMatches(isAdmin());
        }
    };

    matchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!isAdmin()) {
            alert('Hanya admin yang dapat menambahkan pertandingan!');
            return;
        }
        const teamA = document.getElementById('teamA').value;
        const teamB = document.getElementById('teamB').value;
        const date = document.getElementById('date').value;
        const match = { teamA, teamB, date, score: { teamA: 0, teamB: 0 }, winner: null, isWO: false };

        await addDoc(collection(db, "matches"), match);

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
