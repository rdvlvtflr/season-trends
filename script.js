async function fetchData(season) {
  const response = await fetch(`data/arsenal_${season}.json`);
  return response.json();
}

const promotedTeams = [
  'Leeds United FC',
  'Burnley FC',
  'Sunderland AFC'
];
const relegatedTeams = [
  'Leicester City FC',
  'Southampton FC',
  'Ipswich Town FC'
];
const teamPairs = {
  'Leeds United FC': 'Leicester City FC',
  'Burnley FC': 'Southampton FC',
  'Sunderland AFC': 'Ipswich Town FC',
  'Leicester City FC': 'Leeds United FC',
  'Southampton FC': 'Burnley FC',
  'Ipswich Town FC': 'Sunderland AFC'
};

function createTable(current, previous, excludePromoted) {
  const table = document.createElement('table');
  const header = document.createElement('tr');
  header.innerHTML = `
    <th>Fixture</th>
    <th>2024/25 Points</th>
    <th>2025/26 Points</th>
  `;
  table.appendChild(header);

  // Filter fixtures if excluding promoted teams
  let filteredFixtures = current.fixtures;
  if (excludePromoted) {
    filteredFixtures = filteredFixtures.filter(f => !promotedTeams.includes(f.opponent));
  }

  // Aggregate points
  let delta = 0;
  for (let i = 0; i < filteredFixtures.length; i++) {
    const cur = filteredFixtures[i];
    if (typeof cur.points === 'number') {
      let prevOpponent = cur.opponent;
      if (teamPairs[cur.opponent]) prevOpponent = teamPairs[cur.opponent];
      if (excludePromoted && (promotedTeams.includes(cur.opponent) || relegatedTeams.includes(prevOpponent))) continue;
      const prev = previous.fixtures.find(f => f.opponent === prevOpponent && f.home === cur.home) || {};
      const prevPoints = typeof prev.points === 'number' ? prev.points : 0;
      delta += cur.points - prevPoints;
    }
  }
  let deltaDisplay = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : `${delta}`;
  const aggRow = document.createElement('tr');
  aggRow.innerHTML = `
    <td><strong>Points Gained</strong></td>
    <td><strong>-</strong></td>
    <td><strong>${deltaDisplay}</strong></td>
  `;
  table.appendChild(aggRow);

  // Match fixtures by opponent and home/away
  for (let i = 0; i < filteredFixtures.length; i++) {
    const cur = filteredFixtures[i];
    let prevOpponent = cur.opponent;
    let pairedName = '';
    if (teamPairs[cur.opponent]) {
      prevOpponent = teamPairs[cur.opponent];
      pairedName = prevOpponent;
    }
    if (excludePromoted && (promotedTeams.includes(cur.opponent) || relegatedTeams.includes(prevOpponent))) continue;
    const prev = previous.fixtures.find(f => f.opponent === prevOpponent && f.home === cur.home) || {};
    function pointsClass(p) {
      if (p === 3) return 'points-3';
      if (p === 1) return 'points-1';
      if (p === 0) return 'points-0';
      return '';
    }
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cur.opponent} (${cur.home ? 'Home' : 'Away'})</td>
      <td class="${pointsClass(prev.points)}">${prev.points ?? '-'}${pairedName ? `<br><small>(${pairedName})</small>` : ''}</td>
      <td class="${pointsClass(cur.points)}">${cur.points ?? '-'}</td>
    `;
    table.appendChild(row);
  }
  return table;
}

async function renderComparison(excludePromoted = false) {
  const [current, previous] = await Promise.all([
    fetchData('2025_26'),
    fetchData('2024_25')
  ]);
  const container = document.getElementById('comparison-table');
  container.innerHTML = '';
  const table = createTable(current, previous, excludePromoted);
  container.appendChild(table);
}

document.addEventListener('DOMContentLoaded', () => {
  // Add toggle button
  const btn = document.createElement('button');
  btn.textContent = 'Exclude Promoted Teams';
  btn.className = 'toggle-btn';
  let exclude = false;
  btn.addEventListener('click', () => {
    exclude = !exclude;
    btn.textContent = exclude ? 'Include Promoted Teams' : 'Exclude Promoted Teams';
    renderComparison(exclude);
  });
  const container = document.getElementById('comparison-table');
  container.parentNode.insertBefore(btn, container);
  renderComparison(false);
});
