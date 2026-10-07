/**
 * Neo4j Graph Database Service
 * Handles Cypher graph queries to retrieve relationships:
 * 1. (Player)-[:PLAYS_FOR {salary, contract_end}]->(Team)
 * 2. (Manager)-[:MANAGES {win_rate, hired_date}]->(Team)
 * 3. (Team)-[:RIVAL_OF {derby_name}]->(Team)
 */

const { getNeo4jDriver, getDbStatus, getInMemoryStore } = require('../config/db');

/**
 * Fetch relationship graph data for a list of player IDs using Cypher query.
 * 
 * @param {Array<string>} playerIds - Array of player IDs to fetch relationships for
 * @returns {Object} Object containing relationship map and the exact Cypher query string
 */
async function getPlayerRelationships(playerIds = []) {
  const cypherQuery = `
    MATCH (p:Player)-[r:PLAYS_FOR]->(t:Team)
    WHERE p.id IN $playerIds
    OPTIONAL MATCH (m:Manager)-[mr:MANAGES]->(t)
    OPTIONAL MATCH (t)-[rr:RIVAL_OF]->(rival:Team)
    RETURN p.id AS playerId,
           t.id AS teamId,
           t.name AS teamName,
           t.stadium AS stadium,
           r.salary AS salary,
           r.contract_end AS contract_end,
           r.jersey_number AS jerseyNumber,
           r.role AS role,
           m.id AS managerId,
           m.name AS managerName,
           mr.win_rate AS winRate,
           mr.hired_date AS hiredDate,
           mr.trophies_won AS trophiesWon,
           collect(DISTINCT {
             rivalId: rival.id,
             rivalName: rival.name,
             derbyName: rr.derby_name,
             intensityScore: rr.intensity_score
           }) AS rivals
  `.trim();

  const params = { playerIds };
  const status = getDbStatus();
  const relationshipMap = {};

  if (status.neo4j.connected) {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const result = await session.run(cypherQuery, params);
      for (const record of result.records) {
        const pId = record.get('playerId');
        relationshipMap[pId] = {
          team: {
            teamId: record.get('teamId'),
            teamName: record.get('teamName'),
            stadium: record.get('stadium')
          },
          contract: {
            salary: record.get('salary'),
            contractEnd: record.get('contract_end'),
            jerseyNumber: record.get('jerseyNumber'),
            role: record.get('role')
          },
          manager: record.get('managerId') ? {
            managerId: record.get('managerId'),
            name: record.get('managerName'),
            winRate: record.get('winRate'),
            hiredDate: record.get('hiredDate'),
            trophiesWon: record.get('trophiesWon')
          } : null,
          rivals: record.get('rivals') ? record.get('rivals').filter(r => r && r.rivalId) : []
        };
      }
    } finally {
      await session.close();
    }
  } else {
    // In-Memory Graph Emulator Fallback
    const store = getInMemoryStore();
    for (const pId of playerIds) {
      const playsFor = store.playsFor.find(pf => pf.playerId === pId);
      if (!playsFor) continue;

      const team = store.teams.find(t => t.teamId === playsFor.teamId);
      const manages = store.manages.find(m => m.teamId === playsFor.teamId);
      const manager = manages ? store.managers.find(m => m.managerId === manages.managerId) : null;
      const rivals = store.rivals
        .filter(r => r.team1Id === playsFor.teamId)
        .map(r => {
          const rivalTeam = store.teams.find(t => t.teamId === r.team2Id);
          return {
            rivalId: r.team2Id,
            rivalName: rivalTeam ? rivalTeam.teamName : r.team2Id,
            derbyName: r.derby_name,
            intensityScore: r.intensity_score
          };
        });

      relationshipMap[pId] = {
        team: {
          teamId: team ? team.teamId : playsFor.teamId,
          teamName: team ? team.teamName : playsFor.teamId,
          stadium: team ? team.stadium : 'N/A'
        },
        contract: {
          salary: playsFor.salary,
          contractEnd: playsFor.contract_end,
          jerseyNumber: playsFor.jersey_number,
          role: playsFor.role
        },
        manager: manager ? {
          managerId: manager.managerId,
          name: manager.name,
          winRate: manages.win_rate,
          hiredDate: manages.hired_date,
          trophiesWon: manages.trophies_won
        } : null,
        rivals: rivals
      };
    }
  }

  return {
    relationshipMap,
    cypherQuery,
    params
  };
}

/**
 * Fetch full graph structure for visualizer (Nodes + Links)
 */
async function getFullGraphData() {
  const status = getDbStatus();
  if (status.neo4j.connected) {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      const nodesMap = new Map();
      const links = [];

      const result = await session.run(`
        MATCH (p:Player)-[r:PLAYS_FOR]->(t:Team)
        OPTIONAL MATCH (m:Manager)-[mr:MANAGES]->(t)
        OPTIONAL MATCH (t)-[rr:RIVAL_OF]->(t2:Team)
        RETURN p, r, t, m, mr, rr, t2
      `);

      for (const rec of result.records) {
        const p = rec.get('p').properties;
        const t = rec.get('t').properties;
        const r = rec.get('r').properties;

        nodesMap.set(p.id, { id: p.id, label: p.name, type: 'Player', subtitle: p.position });
        nodesMap.set(t.id, { id: t.id, label: t.name || t.teamName, type: 'Team', subtitle: t.league });
        links.push({ source: p.id, target: t.id, label: 'PLAYS_FOR', details: `Salary: €${(r.salary/1e6).toFixed(1)}M` });

        const m = rec.get('m') ? rec.get('m').properties : null;
        const mr = rec.get('mr') ? rec.get('mr').properties : null;
        if (m && mr) {
          nodesMap.set(m.id, { id: m.id, label: m.name, type: 'Manager', subtitle: `${mr.win_rate}% Win Rate` });
          links.push({ source: m.id, target: t.id, label: 'MANAGES', details: `Win Rate: ${mr.win_rate}%` });
        }

        const t2 = rec.get('t2') ? rec.get('t2').properties : null;
        const rr = rec.get('rr') ? rec.get('rr').properties : null;
        if (t2 && rr) {
          nodesMap.set(t2.id, { id: t2.id, label: t2.name || t2.teamName, type: 'Team', subtitle: t2.league });
          links.push({ source: t.id, target: t2.id, label: 'RIVAL_OF', details: rr.derby_name });
        }
      }

      return { nodes: Array.from(nodesMap.values()), links };
    } finally {
      await session.close();
    }
  } else {
    // In-Memory Graph Data
    const store = getInMemoryStore();
    const nodes = [];
    const links = [];

    store.players.forEach(p => nodes.push({ id: p.playerId, label: p.name, type: 'Player', subtitle: p.position }));
    store.teams.forEach(t => nodes.push({ id: t.teamId, label: t.teamName, type: 'Team', subtitle: t.league }));
    store.managers.forEach(m => nodes.push({ id: m.managerId, label: m.name, type: 'Manager', subtitle: m.nationality }));

    store.playsFor.forEach(pf => {
      links.push({ source: pf.playerId, target: pf.teamId, label: 'PLAYS_FOR', details: `Salary: €${(pf.salary/1e6).toFixed(1)}M` });
    });

    store.manages.forEach(m => {
      links.push({ source: m.managerId, target: m.teamId, label: 'MANAGES', details: `Win Rate: ${m.win_rate}%` });
    });

    store.rivals.forEach(r => {
      links.push({ source: r.team1Id, target: r.team2Id, label: 'RIVAL_OF', details: r.derby_name });
    });

    return { nodes, links };
  }
}

module.exports = {
  getPlayerRelationships,
  getFullGraphData
};
