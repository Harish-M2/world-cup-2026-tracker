const leaderboardList = document.querySelector("#leaderboardList");
const podium = document.querySelector("#podium");
const allocationsBody = document.querySelector("#allocationsBody");
const allMatchesList = document.querySelector("#allMatchesList");
const tickerTrack = document.querySelector("#tickerTrack");
const lastUpdated = document.querySelector("#lastUpdated");
const warningEl = document.querySelector("#warning");
const refreshBtn = document.querySelector("#refreshBtn");
const statPlayers = document.querySelector("#statPlayers");
const statTeams = document.querySelector("#statTeams");
const statMatches = document.querySelector("#statMatches");

// Pagination state
let currentPage = 1;
let totalPages = 1;
const prevPageBtn = document.querySelector("#prevPageBtn");
const nextPageBtn = document.querySelector("#nextPageBtn");
const prevPageBtnBottom = document.querySelector("#prevPageBtnBottom");
const nextPageBtnBottom = document.querySelector("#nextPageBtnBottom");
const pageInfo = document.querySelector("#pageInfo");
const pageInfoBottom = document.querySelector("#pageInfoBottom");

const REFRESH_INTERVAL_MS = 60_000;

refreshBtn.addEventListener("click", async () => {
  await refreshFromServer(true);
});

prevPageBtn?.addEventListener("click", () => loadMatchesPage(currentPage - 1));
nextPageBtn?.addEventListener("click", () => loadMatchesPage(currentPage + 1));
prevPageBtnBottom?.addEventListener("click", () => loadMatchesPage(currentPage - 1));
nextPageBtnBottom?.addEventListener("click", () => loadMatchesPage(currentPage + 1));

async function refreshFromServer(forceRefresh = false) {
  try {
    const endpoint = forceRefresh ? "/api/refresh" : "/api/leaderboard";
    const method = forceRefresh ? "POST" : "GET";

    const response = await fetch(endpoint, { method });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const state = await response.json();
    renderState(state);
  } catch (error) {
    warningEl.style.display = "block";
    warningEl.textContent = `Could not load live scores: ${error.message}`;
  }
}

function renderState(state) {
  lastUpdated.textContent = new Date(state.lastUpdated).toLocaleString();

  if (state.warning) {
    warningEl.style.display = "block";
    warningEl.textContent = state.lastError
      ? `${state.warning} Details: ${state.lastError}`
      : state.warning;
  } else {
    warningEl.style.display = "none";
    warningEl.textContent = "";
  }

  renderLeaderboard(state.leaderboard || []);
  renderAllocations(state.leaderboard || []);
  renderStats(state.leaderboard || [], state.recentMatches || []);
  renderTicker(state.recentMatches || [], state.leaderboard || []);
}

function renderLeaderboard(rows) {
  podium.innerHTML = "";
  leaderboardList.innerHTML = "";

  const topThree = rows.slice(0, 3);
  const rest = rows.slice(3);

  topThree.forEach((row, index) => {
    const card = document.createElement("article");
    card.className = `podium-card podium-${index + 1}`;
    card.style.setProperty("--delay", `${index * 90}ms`);

    card.innerHTML = `
      <p class="podium-place">${index + 1}</p>
      <p class="podium-name">${row.name}</p>
      <p class="podium-points">${row.points} pts</p>
    `;

    podium.appendChild(card);
  });

  rest.forEach((row, index) => {
    const item = document.createElement("li");
    const rank = index + 4;
    item.style.setProperty("--delay", `${index * 60}ms`);
    item.className = row.points > 0 ? "leaderboard-hit" : "leaderboard-neutral";

    item.innerHTML = `
      <span class="place">${rank}.</span>
      <span class="name">${row.name}</span>
      <span class="points">${row.points} pts</span>
    `;

    leaderboardList.appendChild(item);
  });
}

function renderStats(rows, matches) {
  const playerCount = rows.length;
  const teamCount = rows.reduce((acc, row) => acc + row.teams.length, 0);

  statPlayers.textContent = String(playerCount);
  statTeams.textContent = String(teamCount);
  statMatches.textContent = String(matches.length);
}

function renderAllocations(rows) {
  allocationsBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const teamCells = row.teams
      .map((team) => `<td><span class="team-chip">${getTeamFlagMarkup(team)} ${escapeHtml(team)}</span></td>`)
      .join("");

    const record = `${row.wins}W ${row.draws}D ${row.losses}L`;

    tr.innerHTML = `
      <td><strong>${row.name}</strong></td>
      ${teamCells}
      <td><span class="record-badge">${record}</span></td>
      <td><strong>${row.points}</strong></td>
    `;

    allocationsBody.appendChild(tr);
  });
}

function renderTicker(matches, rows) {
  const leader = rows[0];
  const leaderText = leader ? `${leader.name} leads on ${leader.points} pts` : "Leaderboard loading";
  const updates = matches.slice(0, 4).map((match) => {
    const homeGoals = match.fullTime?.home ?? "-";
    const awayGoals = match.fullTime?.away ?? "-";
    return `${match.homeTeam} ${homeGoals}-${awayGoals} ${match.awayTeam}`;
  });

  const tickerItems = [
    leaderText,
    ...updates,
    "Win = 3, Draw = 2, Loss = 0",
    "World Cup sweepstake live"
  ];

  tickerTrack.innerHTML = tickerItems
    .map((item) => `<span class="ticker-item">${escapeHtml(item)}</span>`) 
    .join('<span class="ticker-dot">•</span>');
}

function getTeamFlagMarkup(team) {
  const normalized = (team || "").trim().toLowerCase();
  const code = TEAM_FLAG_CODES[normalized];

  if (!code) {
    return '<span class="flag-fallback" aria-hidden="true">🌍</span>';
  }

  const alt = `${escapeHtml(team)} flag`;
  return `<img class="flag-icon" src="https://flagcdn.com/24x18/${code}.png" alt="${alt}" loading="lazy" />`;
}

const TEAM_FLAG_CODES = {
  qatar: "qa",
  algeria: "dz",
  turkey: "tr",
  "united states": "us",
  argentina: "ar",
  panama: "pa",
  australia: "au",
  canada: "ca",
  croatia: "hr",
  netherlands: "nl",
  "cape verde": "cv",
  "czech republic": "cz",
  czechia: "cz",
  sweden: "se",
  colombia: "co",
  germany: "de",
  "republic of the congo": "cg",
  "bosnia and herzegovina": "ba",
  scotland: "gb",
  japan: "jp",
  spain: "es",
  uzbekistan: "uz",
  ghana: "gh",
  senegal: "sn",
  uruguay: "uy",
  belgium: "be",
  "saudi arabia": "sa",
  iran: "ir",
  austria: "at",
  mexico: "mx",
  brazil: "br",
  iraq: "iq",
  egypt: "eg",
  paraguay: "py",
  switzerland: "ch",
  portugal: "pt",
  "new zealand": "nz",
  tunisia: "tn",
  "ivory coast": "ci",
  norway: "no",
  france: "fr",
  "south africa": "za",
  "south korea": "kr",
  ecuador: "ec",
  morocco: "ma",
  england: "gb"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadMatchesPage(page) {
  try {
    const response = await fetch(`/api/matches?page=${page}&limit=20`);
    if (!response.ok) {
      throw new Error(`Failed to load matches (${response.status})`);
    }
    const data = await response.json();
    currentPage = data.pagination.page;
    totalPages = data.pagination.totalPages;
    renderAllMatches(data.matches);
    updatePaginationButtons();
  } catch (error) {
    console.error("Error loading matches:", error);
    allMatchesList.innerHTML = `<li style="color: red;">Failed to load matches: ${escapeHtml(error.message)}</li>`;
  }
}

function updatePaginationButtons() {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  prevPageBtn.disabled = isFirstPage;
  nextPageBtn.disabled = isLastPage;
  prevPageBtnBottom.disabled = isFirstPage;
  nextPageBtnBottom.disabled = isLastPage;

  const info = `Page ${currentPage} of ${totalPages}`;
  pageInfo.textContent = info;
  pageInfoBottom.textContent = info;
}

function renderAllMatches(matches) {
  allMatchesList.innerHTML = "";

  if (matches.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No matches on this page.";
    allMatchesList.appendChild(empty);
    return;
  }

  for (const match of matches) {
    const li = document.createElement("li");
    const homeGoals = match.fullTime?.home ?? "-";
    const awayGoals = match.fullTime?.away ?? "-";
    const scoreLabel = homeGoals !== "-" && awayGoals !== "-" ? `${homeGoals} - ${awayGoals}` : "FT";
    const matchDate = new Date(match.utcDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    li.innerHTML = `
      <div class="match-item">
        <span class="match-date">${escapeHtml(matchDate)}</span>
        <span class="match-team match-home">${getTeamFlagMarkup(match.homeTeam)} ${escapeHtml(match.homeTeam)}</span>
        <span class="match-score">${escapeHtml(scoreLabel)}</span>
        <span class="match-team match-away">${getTeamFlagMarkup(match.awayTeam)} ${escapeHtml(match.awayTeam)}</span>
      </div>
    `;
    allMatchesList.appendChild(li);
  }
}

refreshFromServer();
loadMatchesPage(1);
setInterval(() => {
  refreshFromServer();
}, REFRESH_INTERVAL_MS);
