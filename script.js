async function fetchData(file) {
  const response = await fetch(file);
  if (!response.ok) throw new Error(`Could not load ${file}: ${response.status}`);
  return response.json();
}

function createTable(current, previous, excludePromoted, config) {
  const table = document.createElement('table');
  const header = document.createElement('tr');
  header.innerHTML = `
    <th>Fixture</th>
    <th>${config.previousSeason.replace('_', '/')} Points</th>
    <th>${config.currentSeason.replace('_', '/')} Points</th>
  `;
  table.appendChild(header);

  // Filter fixtures if excluding promoted teams
  let filteredFixtures = current.fixtures;
  if (excludePromoted) {
    filteredFixtures = filteredFixtures.filter(f => !config.promotedTeams.includes(f.opponent));
  }

  // Aggregate points
  let delta = 0;
  for (let i = 0; i < filteredFixtures.length; i++) {
    const cur = filteredFixtures[i];
    if (typeof cur.points === 'number') {
      let prevOpponent = cur.opponent;
      if (config.teamPairs[cur.opponent]) prevOpponent = config.teamPairs[cur.opponent];
      if (excludePromoted && (config.promotedTeams.includes(cur.opponent) || config.relegatedTeams.includes(prevOpponent))) continue;
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
    if (config.teamPairs[cur.opponent]) {
      prevOpponent = config.teamPairs[cur.opponent];
      pairedName = prevOpponent;
    }
    if (excludePromoted && (config.promotedTeams.includes(cur.opponent) || config.relegatedTeams.includes(prevOpponent))) continue;
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
  const container = document.getElementById('comparison-table');
  try {
    const config = await fetchData('season-config.json');
    const [current, previous] = await Promise.all([
      fetchData(`data/arsenal_${config.currentSeason}.json`),
      fetchData(`data/arsenal_${config.previousSeason}.json`)
    ]);
    container.innerHTML = '';
    const table = createTable(current, previous, excludePromoted, config);
    container.appendChild(table);
  } catch (error) {
    console.error('Failed to render fixture comparison:', error);
    container.textContent = 'Unable to load the fixture comparison. Check the browser console for details.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add toggle button
  const btn = document.createElement('button');
  btn.textContent = 'Exclude Promoted Teams';
  btn.style.marginBottom = '20px';
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
