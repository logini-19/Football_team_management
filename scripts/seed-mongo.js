/**
 * Standalone MongoDB Database Seed Script
 * Run with: node scripts/seed-mongo.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const seedData = require('../server/data/seedData');

async function seedMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/football_management';
  console.log(`Connecting to MongoDB at ${uri}...`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log('Clearing existing MongoDB collections...');
    await db.collection('teams').deleteMany({});
    await db.collection('managers').deleteMany({});
    await db.collection('players').deleteMany({});

    console.log('Inserting Teams catalog documents...');
    await db.collection('teams').insertMany(seedData.teams);

    console.log('Inserting Managers catalog documents...');
    await db.collection('managers').insertMany(seedData.managers);

    console.log('Inserting Players catalog documents...');
    await db.collection('players').insertMany(seedData.players);

    console.log('✅ MongoDB database successfully populated with rich attribute documents!');
  } catch (err) {
    console.error('❌ MongoDB seeding failed:', err);
  } finally {
    await client.close();
  }
}

seedMongo();
