/**
 * Polyglot Database Configuration Module
 * Manages connections for both MongoDB (Document Store) and Neo4j (Graph Database).
 * Features fallback emulation if local database services are currently offline.
 */

const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');
const seedData = require('../data/seedData');

let mongoClient = null;
let mongoDb = null;
let neo4jDriver = null;

let dbStatus = {
  mongo: { connected: false, mode: 'disconnected' },
  neo4j: { connected: false, mode: 'disconnected' }
};

// In-memory fallback dataset for seamless offline / zero-config demo
let inMemoryStore = {
  players: [...seedData.players],
  teams: [...seedData.teams],
  managers: [...seedData.managers],
  playsFor: [...seedData.playsForRelationships],
  manages: [...seedData.managesRelationships],
  rivals: [...seedData.rivalRelationships]
};

/**
 * Initialize MongoDB Connection
 */
async function initMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/football_management';
  try {
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    dbStatus.mongo = { connected: true, mode: 'live', uri };
    console.log(`[MongoDB] Successfully connected to live instance at ${uri}`);

    // Check if collections are empty; if so, auto-seed
    const playerCol = mongoDb.collection('players');
    const playerCount = await playerCol.countDocuments();
    if (playerCount === 0) {
      console.log('[MongoDB] Seeding initial document catalog data...');
      await mongoDb.collection('teams').insertMany(seedData.teams);
      await mongoDb.collection('managers').insertMany(seedData.managers);
      await mongoDb.collection('players').insertMany(seedData.players);
      console.log('[MongoDB] Catalog seed complete.');
    }
  } catch (err) {
    console.warn(`[MongoDB] Live connection failed (${err.message}). Activating in-memory document emulator mode.`);
    dbStatus.mongo = { connected: false, mode: 'emulated', error: err.message };
  }
}

/**
 * Initialize Neo4j Graph Connection
 */
async function initNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  try {
    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 2000
    });
    await neo4jDriver.verifyConnectivity();
    dbStatus.neo4j = { connected: true, mode: 'live', uri };
    console.log(`[Neo4j] Successfully connected to live Bolt instance at ${uri}`);

    // Check if nodes exist; if empty, seed graph schema
    const session = neo4jDriver.session();
    try {
      const result = await session.run('MATCH (n:Player) RETURN count(n) AS count');
      const count = result.records[0].get('count').toNumber();
      if (count === 0) {
        console.log('[Neo4j] Seeding initial graph nodes & relationships...');
        await seedNeo4jGraph(session);
        console.log('[Neo4j] Graph seed complete.');
      }
    } finally {
      await session.close();
    }
  } catch (err) {
    console.warn(`[Neo4j] Live graph connection failed (${err.message}). Activating in-memory Cypher emulator mode.`);
    dbStatus.neo4j = { connected: false, mode: 'emulated', error: err.message };
  }
}

/**
 * Seed Neo4j Database using Cypher Statements
 */
async function seedNeo4jGraph(session) {
  // Clear graph
  await session.run('MATCH (n) DETACH DELETE n');

  // Create Teams
  for (const t of seedData.teams) {
    await session.run(
      'CREATE (:Team {id: $teamId, name: $teamName, stadium: $stadium, league: $league})',
      t
    );
  }

  // Create Managers
  for (const m of seedData.managers) {
    await session.run(
      'CREATE (:Manager {id: $managerId, name: $name, nationality: $nationality})',
      m
    );
  }

  // Create Players
  for (const p of seedData.players) {
    await session.run(
      'CREATE (:Player {id: $playerId, name: $name, position: $position, nationality: $nationality})',
      p
    );
  }

  // Create PLAYS_FOR Relationships
  for (const rel of seedData.playsForRelationships) {
    await session.run(
      `MATCH (p:Player {id: $playerId}), (t:Team {id: $teamId})
       CREATE (p)-[:PLAYS_FOR {salary: $salary, contract_end: $contract_end, jersey_number: $jersey_number, role: $role}]->(t)`,
      rel
    );
  }

  // Create MANAGES Relationships
  for (const rel of seedData.managesRelationships) {
    await session.run(
      `MATCH (m:Manager {id: $managerId}), (t:Team {id: $teamId})
       CREATE (m)-[:MANAGES {win_rate: $win_rate, hired_date: $hired_date, trophies_won: $trophies_won}]->(t)`,
      rel
    );
  }

  // Create RIVAL_OF Relationships
  for (const rel of seedData.rivalRelationships) {
    await session.run(
      `MATCH (t1:Team {id: $team1Id}), (t2:Team {id: $team2Id})
       CREATE (t1)-[:RIVAL_OF {derby_name: $derby_name, intensity_score: $intensity_score, matches_played: $matches_played}]->(t2)
       CREATE (t2)-[:RIVAL_OF {derby_name: $derby_name, intensity_score: $intensity_score, matches_played: $matches_played}]->(t1)`,
      rel
    );
  }
}

function getMongoDb() {
  return mongoDb;
}

function getNeo4jDriver() {
  return neo4jDriver;
}

function getDbStatus() {
  return dbStatus;
}

function getInMemoryStore() {
  return inMemoryStore;
}

module.exports = {
  initMongo,
  initNeo4j,
  getMongoDb,
  getNeo4jDriver,
  getDbStatus,
  getInMemoryStore,
  seedNeo4jGraph
};
