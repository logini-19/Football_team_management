/**
 * Unified Polyglot Database Seeder (MongoDB + Neo4j)
 * Run with: npm run seed
 */

require('dotenv').config();
const { initMongo, initNeo4j, getMongoDb, getNeo4jDriver, seedNeo4jGraph, getDbStatus } = require('../server/config/db');
const seedData = require('../server/data/seedData');

async function runSeed() {
  console.log('🌱 Starting Polyglot Database Seeding Process...');

  // 1. Seed MongoDB
  await initMongo();
  const db = getMongoDb();

  if (db) {
    console.log('[MongoDB] Clearing old collections...');
    await db.collection('teams').deleteMany({});
    await db.collection('managers').deleteMany({});
    await db.collection('players').deleteMany({});

    console.log('[MongoDB] Inserting rich catalog documents...');
    await db.collection('teams').insertMany(seedData.teams);
    await db.collection('managers').insertMany(seedData.managers);
    await db.collection('players').insertMany(seedData.players);
    console.log('[MongoDB] ✅ Document seeding complete.');
  } else {
    console.warn('[MongoDB] Live instance unavailable. In-memory store ready.');
  }

  // 2. Seed Neo4j
  await initNeo4j();
  const status = getDbStatus();
  if (status.neo4j.connected) {
    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
      console.log('[Neo4j] Clearing old graph and creating nodes/relationships...');
      await seedNeo4jGraph(session);
      console.log('[Neo4j] ✅ Graph seeding complete.');
    } finally {
      await session.close();
      await driver.close();
    }
  } else {
    console.warn('[Neo4j] Live instance unavailable. In-memory graph ready.');
  }

  console.log('✨ All polyglot database seed tasks finished!');
  process.exit(0);
}

runSeed();
