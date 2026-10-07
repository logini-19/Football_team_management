/**
 * MongoDB Service
 * Handles NoSQL document queries, dynamic $match filtering, projections, and $sort criteria.
 * Returns both query results and the generated NoSQL query structure for academic inspection.
 */

const { getMongoDb, getDbStatus, getInMemoryStore } = require('../config/db');

/**
 * Fetch players from MongoDB document store using dynamic filtering and sorting.
 * 
 * @param {Object} filters
 * @param {Array<string>} [filters.positions] - List of positions to match
 * @param {Array<string>} [filters.nationalities] - List of nationalities to match
 * @param {number} [filters.minAge] - Minimum age boundary
 * @param {number} [filters.maxAge] - Maximum age boundary
 * @param {string} [filters.search] - Text query for player name search
 * @param {string} [filters.sortBy] - Sort directive (e.g., marketValue_desc, name_asc)
 */
async function getFilteredPlayers(filters = {}) {
  const {
    positions,
    nationalities,
    minAge,
    maxAge,
    search,
    sortBy = 'marketValue_desc'
  } = filters;

  // 1. Construct MongoDB $match pipeline stage dynamically
  const matchStage = {};

  if (positions && positions.length > 0) {
    matchStage.position = { $in: positions };
  }

  if (nationalities && nationalities.length > 0) {
    matchStage.nationality = { $in: nationalities };
  }

  if (minAge !== undefined || maxAge !== undefined) {
    matchStage.age = {};
    if (minAge !== undefined && minAge !== '') matchStage.age.$gte = Number(minAge);
    if (maxAge !== undefined && maxAge !== '') matchStage.age.$lte = Number(maxAge);
  }

  if (search && search.trim() !== '') {
    matchStage.name = { $regex: search.trim(), $options: 'i' };
  }

  // 2. Construct MongoDB $sort stage dynamically
  const sortStage = {};
  switch (sortBy) {
    case 'marketValue_asc':
      sortStage.marketValue = 1;
      break;
    case 'name_asc':
      sortStage.name = 1;
      break;
    case 'name_desc':
      sortStage.name = -1;
      break;
    case 'age_asc':
      sortStage.age = 1;
      break;
    case 'age_desc':
      sortStage.age = -1;
      break;
    case 'marketValue_desc':
    default:
      sortStage.marketValue = -1;
      break;
  }

  const status = getDbStatus();
  let results = [];

  if (status.mongo.connected) {
    // Execute live MongoDB query
    const db = getMongoDb();
    results = await db.collection('players')
      .find(matchStage)
      .sort(sortStage)
      .toArray();
  } else {
    // In-Memory Fallback Engine
    const store = getInMemoryStore();
    results = store.players.filter(p => {
      if (positions && positions.length > 0 && !positions.includes(p.position)) return false;
      if (nationalities && nationalities.length > 0 && !nationalities.includes(p.nationality)) return false;
      if (minAge !== undefined && minAge !== '' && p.age < Number(minAge)) return false;
      if (maxAge !== undefined && maxAge !== '' && p.age > Number(maxAge)) return false;
      if (search && search.trim() !== '') {
        if (!p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });

    // In-memory sorting
    results.sort((a, b) => {
      if (sortStage.marketValue) return (b.marketValue - a.marketValue) * (sortStage.marketValue === -1 ? 1 : -1);
      if (sortStage.name) return a.name.localeCompare(b.name) * sortStage.name;
      if (sortStage.age) return (a.age - b.age) * sortStage.age;
      return 0;
    });
  }

  return {
    players: results,
    mongoQuery: {
      collection: "players",
      find: matchStage,
      sort: sortStage
    }
  };
}

/**
 * Fetch a single team document from MongoDB by teamId
 */
async function getTeamById(teamId) {
  const status = getDbStatus();
  if (status.mongo.connected) {
    const db = getMongoDb();
    return await db.collection('teams').findOne({ teamId });
  } else {
    const store = getInMemoryStore();
    return store.teams.find(t => t.teamId === teamId);
  }
}

/**
 * Fetch all team documents from MongoDB
 */
async function getAllTeams() {
  const status = getDbStatus();
  if (status.mongo.connected) {
    const db = getMongoDb();
    return await db.collection('teams').find({}).toArray();
  } else {
    const store = getInMemoryStore();
    return store.teams;
  }
}

module.exports = {
  getFilteredPlayers,
  getTeamById,
  getAllTeams
};
