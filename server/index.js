/**
 * Football Team Management System
 * Express Full-Stack Application Entry Point
 * Demonstrates Polyglot Persistence (MongoDB + Neo4j) & XML Integration
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initMongo, initNeo4j, getDbStatus } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for Single Page Application routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server and Initialize Databases
async function startServer() {
  console.log('======================================================');
  console.log('  FOOTBALL TEAM MANAGEMENT SYSTEM (POLYGLOT PERSISTENCE)');
  console.log('======================================================');
  
  await initMongo();
  await initNeo4j();

  const status = getDbStatus();
  console.log('------------------------------------------------------');
  console.log(`[Status Summary] MongoDB: ${status.mongo.mode.toUpperCase()} | Neo4j: ${status.neo4j.mode.toUpperCase()}`);
  console.log('------------------------------------------------------');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Search Players XML Endpoint: http://localhost:${PORT}/api/search-players`);
    console.log(`🔍 Graph API Endpoint: http://localhost:${PORT}/api/graph`);
    console.log('======================================================');
  });
}

startServer();
