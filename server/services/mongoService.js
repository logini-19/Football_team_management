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
 * Fetch a single player document from MongoDB by playerId
 */
async function getPlayerById(playerId) {
  const status = getDbStatus();
  const filter = { playerId };

  if (status.mongo.connected) {
    const db = getMongoDb();
    const player = await db.collection('players').findOne(filter);
    return {
      player,
      mongoQuery: {
        operation: 'findOne',
        collection: 'players',
        filter
      }
    };
  } else {
    const store = getInMemoryStore();
    const player = store.players.find(p => p.playerId === playerId) || null;
    return {
      player,
      mongoQuery: {
        operation: 'findOne',
        collection: 'players',
        filter,
        mode: 'emulated'
      }
    };
  }
}

/**
 * Create a new player document in MongoDB
 */
async function createPlayer(playerData) {
  const status = getDbStatus();

  // Construct sanitized document
  const document = {
    playerId: String(playerData.playerId).trim(),
    name: String(playerData.name).trim(),
    age: Number(playerData.age),
    marketValue: Number(playerData.marketValue),
    position: String(playerData.position).trim(),
    nationality: String(playerData.nationality).trim(),
    bio: String(playerData.bio || '').trim(),
    preferredFoot: String(playerData.preferredFoot || 'Right').trim(),
    shirtNumber: Number(playerData.shirtNumber) || 10,
    stats: {
      goals: Number(playerData.stats?.goals || 0),
      assists: Number(playerData.stats?.assists || 0),
      appearances: Number(playerData.stats?.appearances || 0),
      rating: Number(playerData.stats?.rating || 7.0),
      passAccuracy: Number(playerData.stats?.passAccuracy || 80.0)
    }
  };

  // Check if player ID already exists
  const existing = await getPlayerById(document.playerId);
  if (existing.player) {
    const err = new Error(`Player with ID '${document.playerId}' already exists.`);
    err.code = 'DUPLICATE_ID';
    throw err;
  }

  if (status.mongo.connected) {
    const db = getMongoDb();
    await db.collection('players').insertOne(document);
  } else {
    const store = getInMemoryStore();
    store.players.push(document);
  }

  return {
    player: document,
    mongoQuery: {
      operation: 'insertOne',
      collection: 'players',
      document
    }
  };
}

/**
 * Update an existing player document in MongoDB
 */
async function updatePlayer(playerId, updateData) {
  const status = getDbStatus();
  const filter = { playerId };

  // Sanitize fields to set (prevent changing playerId or _id)
  const $set = {};
  if (updateData.name !== undefined) $set.name = String(updateData.name).trim();
  if (updateData.age !== undefined) $set.age = Number(updateData.age);
  if (updateData.marketValue !== undefined) $set.marketValue = Number(updateData.marketValue);
  if (updateData.position !== undefined) $set.position = String(updateData.position).trim();
  if (updateData.nationality !== undefined) $set.nationality = String(updateData.nationality).trim();
  if (updateData.bio !== undefined) $set.bio = String(updateData.bio).trim();
  if (updateData.preferredFoot !== undefined) $set.preferredFoot = String(updateData.preferredFoot).trim();
  if (updateData.shirtNumber !== undefined) $set.shirtNumber = Number(updateData.shirtNumber);
  
  if (updateData.stats) {
    $set.stats = {
      goals: Number(updateData.stats.goals ?? 0),
      assists: Number(updateData.stats.assists ?? 0),
      appearances: Number(updateData.stats.appearances ?? 0),
      rating: Number(updateData.stats.rating ?? 7.0),
      passAccuracy: Number(updateData.stats.passAccuracy ?? 80.0)
    };
  }

  if (status.mongo.connected) {
    const db = getMongoDb();
    const result = await db.collection('players').updateOne(filter, { $set });
    if (result.matchedCount === 0) return null;

    const updatedPlayer = await db.collection('players').findOne(filter);
    return {
      player: updatedPlayer,
      mongoQuery: {
        operation: 'updateOne',
        collection: 'players',
        filter,
        update: { $set }
      }
    };
  } else {
    const store = getInMemoryStore();
    const playerIndex = store.players.findIndex(p => p.playerId === playerId);
    if (playerIndex === -1) return null;

    store.players[playerIndex] = {
      ...store.players[playerIndex],
      ...$set
    };

    return {
      player: store.players[playerIndex],
      mongoQuery: {
        operation: 'updateOne',
        collection: 'players',
        filter,
        update: { $set },
        mode: 'emulated'
      }
    };
  }
}

/**
 * Delete a player document from MongoDB
 */
async function deletePlayer(playerId) {
  const status = getDbStatus();
  const filter = { playerId };

  const existing = await getPlayerById(playerId);
  if (!existing.player) return null;

  if (status.mongo.connected) {
    const db = getMongoDb();
    await db.collection('players').deleteOne(filter);
  } else {
    const store = getInMemoryStore();
    store.players = store.players.filter(p => p.playerId !== playerId);
  }

  return {
    deletedPlayerId: playerId,
    mongoQuery: {
      operation: 'deleteOne',
      collection: 'players',
      filter
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
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getTeamById,
  getAllTeams
};
