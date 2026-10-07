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
const { getFilteredPlayers, getTeamById, getAllTeams } = require('../services/mongoService');
const { getPlayerRelationships, getFullGraphData } = require('../services/neo4jService');
const { buildPlayersXml } = require('../services/xmlService');
const { getDbStatus, initMongo, initNeo4j, seedNeo4jGraph, getNeo4jDriver } = require('../config/db');

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
    const graphData = await getFullGraphData();
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
