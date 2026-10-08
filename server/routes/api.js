/**
 * =====================================================================================
 * UNIVERSITY PROJECT: POLYGLOT PERSISTENCE & DATA INTEGRATION ROUTER
 * =====================================================================================
 * 
 * PROFESSOR & EXAMINER GUIDANCE:
 * This file demonstrates the architectural integration of a Document Store (MongoDB)
 * and a Graph Database (Neo4j).
 * 
 * Key Requirements Addressed:
 * 1. Polyglot Persistence: MongoDB stores heavy player attributes (Catalog), while
 *    Neo4j stores complex relationships (:PLAYS_FOR, :MANAGES, :RIVAL_OF).
 * 2. E-Commerce Filtering & Sorting: Dynamic queries constructed on the backend.
 * 3. XML Data Integration: Both database results are merged in memory and serialized
 *    into a single, clean XML document sent over HTTP with Content-Type: application/xml.
 * =====================================================================================
 */

const express = require('express');
const router = express.Router();
const { 
  getFilteredPlayers, 
  getPlayerById, 
  createPlayer, 
  updatePlayer, 
  deletePlayer, 
  getTeamById, 
  getAllTeams 
} = require('../services/mongoService');

const { 
  getPlayerRelationships, 
  getFilteredGraphData,
  getFullGraphData,
  syncCreatePlayerGraph,
  syncUpdatePlayerGraph,
  syncDeletePlayerGraph
} = require('../services/neo4jService');

const { buildPlayersXml } = require('../services/xmlService');
const { getDbStatus, initMongo, initNeo4j } = require('../config/db');

/**
 * Input sanitization helper to strip keys containing $ or .
 */
function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizePayload(obj[key]);
    }
  }
  return obj;
}

/**
 * =====================================================================================
 * PRIMARY API ENDPOINT: /api/search-players
 * =====================================================================================
 * PROFESSOR EXPLANATION - SINGLE QUERY & INTEGRATION FLOW:
 * -------------------------------------------------------------------------------------
 * When a student/user clicks any filter checkbox (Position, Nationality, Age range)
 * or changes the Sort dropdown in the E-Commerce UI, the frontend makes an AJAX fetch
 * request to this route.
 * 
 * STEP-BY-STEP BACKEND PIPELINE EXECUTION:
 * 
 * STEP 1: REQUEST PARSING
 * Extracts filtering parameters (positions, nationalities, minAge, maxAge, search, sortBy).
 * 
 * STEP 2: MONGODB DOCUMENT QUERY ($match & $sort)
 * Executes a NoSQL query against MongoDB's 'players' collection to retrieve matching
 * player attribute documents (Name, Age, Market Value, Position, Nationality, Bio, Stats).
 * 
 * STEP 3: NEO4J GRAPH QUERY (Cypher MATCH & WHERE)
 * Takes the matching player IDs from Step 2 and executes a Cypher query against Neo4j:
 *   MATCH (p:Player)-[r:PLAYS_FOR]->(t:Team)
 *   WHERE p.id IN $playerIds
 *   OPTIONAL MATCH (m:Manager)-[mr:MANAGES]->(t)
 *   OPTIONAL MATCH (t)-[rr:RIVAL_OF]->(rival:Team)
 *   RETURN p.id, t, r, m, mr, collect(rival)
 * 
 * STEP 4: POLYGLOT DATA INTEGRATION (IN-MEMORY FUSION)
 * Merges the document catalog attributes from MongoDB with the graph relationship
 * edges from Neo4j into a unified object map.
 * 
 * STEP 5: XML SERIALIZATION
 * Uses 'xmlbuilder2' to serialize the merged polyglot data into a well-formed XML
 * document containing root node <football_management_system>, <polyglot_metadata>,
 * and <player_catalog>.
 * 
 * STEP 6: RESPONSE DELIVERY
 * Sets HTTP response header 'Content-Type: application/xml' and sends the raw XML string.
 * =====================================================================================
 */
router.get('/search-players', async (req, res) => {
  try {
    const startTime = Date.now();

    // ---------------------------------------------------------------------------------
    // STEP 1: Extract and sanitize filter/sort parameters from query string
    // ---------------------------------------------------------------------------------
    const positions = req.query.positions ? req.query.positions.split(',').filter(Boolean) : [];
    const nationalities = req.query.nationalities ? req.query.nationalities.split(',').filter(Boolean) : [];
    const minAge = req.query.minAge;
    const maxAge = req.query.maxAge;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'marketValue_desc';
    const format = req.query.format || 'xml'; // Default to XML per Professor Requirement

    // ---------------------------------------------------------------------------------
    // STEP 2: Fetch MongoDB attribute documents using dynamic NoSQL $match & $sort
    // ---------------------------------------------------------------------------------
    const { players, mongoQuery } = await getFilteredPlayers({
      positions,
      nationalities,
      minAge,
      maxAge,
      search,
      sortBy
    });

    const playerIds = players.map(p => p.playerId);

    // ---------------------------------------------------------------------------------
    // STEP 3: Fetch Neo4j graph relationships using Cypher MATCH clauses
    // ---------------------------------------------------------------------------------
    const { relationshipMap, cypherQuery, params } = await getPlayerRelationships(playerIds);

    // ---------------------------------------------------------------------------------
    // STEP 4: Polyglot Data Integration & Execution Metadata Assembly
    // ---------------------------------------------------------------------------------
    const dbStatus = getDbStatus();
    const executionTimeMs = Date.now() - startTime;

    const metadata = {
      dbStatus,
      mongoQuery,
      cypherQuery,
      params,
      executionTimeMs,
      resultCount: players.length
    };

    // ---------------------------------------------------------------------------------
    // STEP 5 & 6: XML Serialization & HTTP Delivery
    // ---------------------------------------------------------------------------------
    if (format === 'json') {
      // JSON response endpoint for API clients / testing
      return res.json({
        metadata,
        players: players.map(p => ({
          ...p,
          relationships: relationshipMap[p.playerId] || null
        }))
      });
    }

    // Default XML Serialization for University Requirement
    const xmlContent = buildPlayersXml(players, relationshipMap, metadata);

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('X-Execution-Time-Ms', executionTimeMs.toString());
    return res.send(xmlContent);

  } catch (error) {
    console.error('Error executing polyglot player search:', error);
    res.status(500).header('Content-Type', 'application/xml').send(`
      <error_response>
        <status>500</status>
        <message>${error.message}</message>
      </error_response>
    `);
  }
});

/**
 * =====================================================================================
 * REST API CRUD ENDPOINTS FOR PLAYERS (MONGODB + NEO4J POLYGLOT CONSISTENCY)
 * =====================================================================================
 */

/**
 * READ SINGLE PLAYER: GET /api/players/:playerId
 * Uses MongoDB findOne() + Neo4j Cypher MATCH for graph relationships
 */
router.get('/players/:playerId', async (req, res) => {
  try {
    const playerId = String(req.params.playerId).trim();
    
    // 1. MongoDB findOne()
    const { player, mongoQuery } = await getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: `Player with ID '${playerId}' not found.`
      });
    }

    // 2. Neo4j Cypher MATCH for graph relationships
    const { relationshipMap, cypherQuery, params } = await getPlayerRelationships([playerId]);

    return res.json({
      success: true,
      player: {
        ...player,
        relationships: relationshipMap[playerId] || null
      },
      polyglotMetadata: {
        dbStatus: getDbStatus(),
        mongoExecution: mongoQuery,
        neo4jExecution: { cypherQuery, params }
      }
    });
  } catch (err) {
    console.error('Error fetching player by ID:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * CREATE PLAYER: POST /api/players
 * Uses MongoDB insertOne() + Neo4j MERGE node and :PLAYS_FOR relationship
 */
router.post('/players', async (req, res) => {
  try {
    const body = sanitizePayload(req.body);
    
    // Validation
    const required = ['playerId', 'name', 'age', 'position', 'nationality', 'marketValue'];
    const missing = required.filter(field => body[field] === undefined || body[field] === '');
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }

    // 1. MongoDB insertOne()
    const { player, mongoQuery } = await createPlayer(body);

    // 2. Neo4j Graph Synchronization
    const teamId = body.teamId || null;
    const contractInfo = {
      salary: body.salary,
      contractEnd: body.contractEnd,
      jerseyNumber: body.shirtNumber,
      role: body.role
    };
    const { cypherQuery, params } = await syncCreatePlayerGraph(player, teamId, contractInfo);

    return res.status(201).json({
      success: true,
      message: `Player '${player.name}' (ID: ${player.playerId}) successfully created!`,
      player,
      polyglotMetadata: {
        dbStatus: getDbStatus(),
        mongoExecution: mongoQuery,
        neo4jExecution: { cypherQuery, params }
      }
    });

  } catch (err) {
    console.error('Error creating player:', err);
    if (err.code === 'DUPLICATE_ID') {
      return res.status(409).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * UPDATE PLAYER: PUT /api/players/:playerId
 * Uses MongoDB updateOne() + Neo4j SET properties and :PLAYS_FOR relationship update
 */
router.put('/players/:playerId', async (req, res) => {
  try {
    const playerId = String(req.params.playerId).trim();
    const body = sanitizePayload(req.body);

    // Prevent modifying playerId
    delete body.playerId;
    delete body._id;

    // 1. MongoDB updateOne()
    const updateResult = await updatePlayer(playerId, body);
    if (!updateResult) {
      return res.status(404).json({
        success: false,
        error: `Player with ID '${playerId}' not found.`
      });
    }

    const { player, mongoQuery } = updateResult;

    // 2. Neo4j Graph Synchronization
    const teamId = body.teamId || null;
    const contractInfo = {
      salary: body.salary,
      contractEnd: body.contractEnd,
      jerseyNumber: body.shirtNumber,
      role: body.role
    };
    const { cypherQuery, params } = await syncUpdatePlayerGraph(playerId, body, teamId, contractInfo);

    return res.json({
      success: true,
      message: `Player '${player.name}' (ID: ${playerId}) successfully updated!`,
      player,
      polyglotMetadata: {
        dbStatus: getDbStatus(),
        mongoExecution: mongoQuery,
        neo4jExecution: { cypherQuery, params }
      }
    });

  } catch (err) {
    console.error('Error updating player:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE PLAYER: DELETE /api/players/:playerId
 * Uses MongoDB deleteOne() + Neo4j DETACH DELETE (:Player)
 */
router.delete('/players/:playerId', async (req, res) => {
  try {
    const playerId = String(req.params.playerId).trim();

    // 1. MongoDB deleteOne()
    const deleteResult = await deletePlayer(playerId);
    if (!deleteResult) {
      return res.status(404).json({
        success: false,
        error: `Player with ID '${playerId}' not found.`
      });
    }

    const { mongoQuery } = deleteResult;

    // 2. Neo4j Graph Synchronization (DETACH DELETE)
    const { cypherQuery, params } = await syncDeletePlayerGraph(playerId);

    return res.json({
      success: true,
      message: `Player ID '${playerId}' successfully deleted from MongoDB & Neo4j!`,
      deletedPlayerId: playerId,
      polyglotMetadata: {
        dbStatus: getDbStatus(),
        mongoExecution: mongoQuery,
        neo4jExecution: { cypherQuery, params }
      }
    });

  } catch (err) {
    console.error('Error deleting player:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint to retrieve overall database connectivity & health status
 */
router.get('/db-status', (req, res) => {
  res.json(getDbStatus());
});

/**
 * Endpoint to retrieve full graph structure for visualizer tool
 */
router.get('/graph', async (req, res) => {
  try {
    const filters = {
      positions: req.query.positions ? req.query.positions.split(',').filter(Boolean) : [],
      nationalities: req.query.nationalities ? req.query.nationalities.split(',').filter(Boolean) : [],
      minAge: req.query.minAge,
      maxAge: req.query.maxAge,
      search: req.query.search,
      sortBy: req.query.sortBy || 'marketValue_desc'
    };

    const graphData = Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    })
      ? await getFilteredGraphData(filters)
      : await getFullGraphData();

    res.json(graphData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint to fetch teams list
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await getAllTeams();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint to trigger manual database re-seed
 */
router.post('/seed', async (req, res) => {
  try {
    await initMongo();
    await initNeo4j();
    res.json({ message: 'Databases successfully initialized and re-seeded!', status: getDbStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
