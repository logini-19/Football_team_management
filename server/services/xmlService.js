/**
 * XML Data Integration Service
 * Transforms document catalog attributes (MongoDB) and graph relationships (Neo4j)
 * into a single unified XML document.
 * (No external photo/image URLs used).
 */

const { create } = require('xmlbuilder2');

/**
 * Format currency number to EUR string (e.g. €180,000,000)
 */
function formatCurrency(val) {
  if (!val) return '€0';
  return '€' + Number(val).toLocaleString('en-US');
}

/**
 * Merge document & graph data into an XML document string
 * 
 * @param {Array} players - MongoDB player document objects
 * @param {Object} relationshipMap - Neo4j graph relationship mapping
 * @param {Object} metadata - Query execution metadata (Mongo query, Cypher query, DB modes)
 * @returns {string} Well-formed XML string
 */
function buildPlayersXml(players = [], relationshipMap = {}, metadata = {}) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('football_management_system', {
      timestamp: new Date().toISOString(),
      total_players: players.length
    });

  // 1. Academic Polyglot Inspection Metadata
  const metaNode = root.ele('polyglot_metadata');
  metaNode.ele('database_status', {
    mongo_mode: metadata.dbStatus?.mongo?.mode || 'unknown',
    neo4j_mode: metadata.dbStatus?.neo4j?.mode || 'unknown'
  });

  metaNode.ele('mongo_execution_plan', { collection: metadata.mongoQuery?.collection || 'players' })
    .ele('find_filter').txt(JSON.stringify(metadata.mongoQuery?.find || {})).up()
    .ele('sort_order').txt(JSON.stringify(metadata.mongoQuery?.sort || {})).up();

  metaNode.ele('neo4j_execution_plan')
    .ele('cypher_query').txt(metadata.cypherQuery || 'N/A').up()
    .ele('parameters').txt(JSON.stringify(metadata.params || {})).up();

  // 2. Player Catalog Node
  const catalogNode = root.ele('player_catalog');

  players.forEach(player => {
    const pId = player.playerId;
    const rel = relationshipMap[pId] || {};

    const playerNode = catalogNode.ele('player', {
      id: pId,
      position: player.position,
      nationality: player.nationality
    });

    // --- MONGODB DOCUMENT ATTRIBUTES ---
    const mongoNode = playerNode.ele('mongo_document_attributes');
    mongoNode.ele('name').txt(player.name);
    mongoNode.ele('age').txt(player.age);
    mongoNode.ele('market_value', {
      currency: 'EUR',
      formatted: formatCurrency(player.marketValue)
    }).txt(player.marketValue);
    mongoNode.ele('bio').txt(player.bio || '');
    mongoNode.ele('shirt_number').txt(player.shirtNumber || '');
    mongoNode.ele('preferred_foot').txt(player.preferredFoot || '');

    if (player.stats) {
      mongoNode.ele('performance_stats')
        .ele('goals').txt(player.stats.goals).up()
        .ele('assists').txt(player.stats.assists).up()
        .ele('appearances').txt(player.stats.appearances).up()
        .ele('rating').txt(player.stats.rating).up()
        .ele('pass_accuracy').txt(player.stats.passAccuracy + '%').up();
    }

    // --- NEO4J GRAPH RELATIONSHIPS ---
    const graphNode = playerNode.ele('neo4j_graph_relationships');

    // Relationship 1: (Player)-[:PLAYS_FOR]->(Team)
    if (rel.team) {
      const playsForNode = graphNode.ele('plays_for_relationship');
      playsForNode.ele('team', { id: rel.team.teamId })
        .ele('name').txt(rel.team.teamName).up()
        .ele('stadium').txt(rel.team.stadium).up();

      if (rel.contract) {
        playsForNode.ele('contract')
          .ele('salary', { currency: 'EUR', formatted: formatCurrency(rel.contract.salary) + '/yr' }).txt(rel.contract.salary).up()
          .ele('contract_end').txt(rel.contract.contractEnd).up()
          .ele('jersey_number').txt(rel.contract.jerseyNumber || '').up()
          .ele('role').txt(rel.contract.role || '').up();
      }
    }

    // Relationship 2: (Manager)-[:MANAGES]->(Team)
    if (rel.manager) {
      graphNode.ele('manages_relationship')
        .ele('manager', { id: rel.manager.managerId })
          .ele('name').txt(rel.manager.name).up()
          .ele('win_rate').txt(rel.manager.winRate + '%').up()
          .ele('hired_date').txt(rel.manager.hiredDate).up()
          .ele('trophies_won').txt(rel.manager.trophiesWon).up();
    }

    // Relationship 3: (Team)-[:RIVAL_OF]->(Team)
    if (rel.rivals && rel.rivals.length > 0) {
      const rivalriesNode = graphNode.ele('team_rivalries');
      rel.rivals.forEach(r => {
        rivalriesNode.ele('rival_of')
          .ele('rival_team', { id: r.rivalId }).txt(r.rivalName).up()
          .ele('derby_name').txt(r.derbyName).up()
          .ele('intensity_score').txt(r.intensityScore).up();
      });
    }
  });

  return root.end({ prettyPrint: true });
}

module.exports = {
  buildPlayersXml,
  formatCurrency
};
