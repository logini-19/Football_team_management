/**
 * Seed Data for Polyglot Database (MongoDB & Neo4j)
 * Includes rich attribute documents and graph relationships.
 * (No external image/photo URLs used).
 */

const teams = [
  {
    teamId: "T001",
    teamName: "Real Madrid",
    stadium: "Santiago Bernabéu",
    budget: 850000000,
    history: "Founded in 1902, Real Madrid is the most successful European club with 15 UEFA Champions League titles.",
    foundedYear: 1902,
    league: "La Liga",
    city: "Madrid",
    country: "Spain"
  },
  {
    teamId: "T002",
    teamName: "Manchester City",
    stadium: "Etihad Stadium",
    budget: 920000000,
    history: "Dominant English powerhouses known for modern tactical innovation and historic 2023 Continental Treble.",
    foundedYear: 1880,
    league: "Premier League",
    city: "Manchester",
    country: "England"
  },
  {
    teamId: "T003",
    teamName: "Arsenal FC",
    stadium: "Emirates Stadium",
    budget: 720000000,
    history: "Renowned North London club famed for the 2003-04 Invincibles season and fluid attacking football.",
    foundedYear: 1886,
    league: "Premier League",
    city: "London",
    country: "England"
  },
  {
    teamId: "T004",
    teamName: "FC Barcelona",
    stadium: "Spotify Camp Nou",
    budget: 780000000,
    history: "World-famous Catalan institution defined by La Masia academy and iconic Tiki-Taka football tradition.",
    foundedYear: 1899,
    league: "La Liga",
    city: "Barcelona",
    country: "Spain"
  },
  {
    teamId: "T005",
    teamName: "Paris Saint-Germain",
    stadium: "Parc des Princes",
    budget: 950000000,
    history: "Parisian football giants featuring elite European talent and multiple French Ligue 1 championships.",
    foundedYear: 1970,
    league: "Ligue 1",
    city: "Paris",
    country: "France"
  },
  {
    teamId: "T006",
    teamName: "FC Bayern Munich",
    stadium: "Allianz Arena",
    budget: 810000000,
    history: "Bavarian giants holding 33 German Bundesliga titles and 6 European Champions League trophies.",
    foundedYear: 1900,
    league: "Bundesliga",
    city: "Munich",
    country: "Germany"
  }
];

const managers = [
  {
    managerId: "M001",
    name: "Carlo Ancelotti",
    age: 65,
    nationality: "Italy",
    experienceYears: 29,
    tacticalStyle: "Flexible / Man-Management Master"
  },
  {
    managerId: "M002",
    name: "Pep Guardiola",
    age: 53,
    nationality: "Spain",
    experienceYears: 16,
    tacticalStyle: "Position-Oriented Positional Play"
  },
  {
    managerId: "M003",
    name: "Mikel Arteta",
    age: 42,
    nationality: "Spain",
    experienceYears: 5,
    tacticalStyle: "High Press & Structural Fluidity"
  },
  {
    managerId: "M004",
    name: "Hansi Flick",
    age: 59,
    nationality: "Germany",
    experienceYears: 18,
    tacticalStyle: "Vertical Gegenpressing"
  },
  {
    managerId: "M005",
    name: "Luis Enrique",
    age: 54,
    nationality: "Spain",
    experienceYears: 13,
    tacticalStyle: "Attacking Direct Possession"
  },
  {
    managerId: "M006",
    name: "Vincent Kompany",
    age: 38,
    nationality: "Belgium",
    experienceYears: 4,
    tacticalStyle: "High-Line Aggressive Transition"
  }
];

const players = [
  {
    playerId: "P001",
    name: "Jude Bellingham",
    age: 21,
    marketValue: 180000000,
    position: "Midfielder",
    nationality: "England",
    bio: "Sensational complete midfielder combining box-to-box dominance, clinical goal scoring, and world-class vision.",
    preferredFoot: "Right",
    shirtNumber: 5,
    stats: { goals: 23, assists: 12, appearances: 42, rating: 8.4, passAccuracy: 89.2 }
  },
  {
    playerId: "P002",
    name: "Kylian Mbappé",
    age: 25,
    marketValue: 180000000,
    position: "Forward",
    nationality: "France",
    bio: "Explosive world-champion forward famous for electrifying pace, lethal finishing, and big-game dominance.",
    preferredFoot: "Right",
    shirtNumber: 9,
    stats: { goals: 44, assists: 10, appearances: 48, rating: 8.7, passAccuracy: 84.1 }
  },
  {
    playerId: "P003",
    name: "Erling Haaland",
    age: 24,
    marketValue: 180000000,
    position: "Forward",
    nationality: "Norway",
    bio: "Record-shattering Norwegian goal machine known for immense athletic power, instincts, and ruthless conversion.",
    preferredFoot: "Left",
    shirtNumber: 9,
    stats: { goals: 38, assists: 6, appearances: 45, rating: 8.5, passAccuracy: 78.5 }
  },
  {
    playerId: "P004",
    name: "Kevin De Bruyne",
    age: 33,
    marketValue: 50000000,
    position: "Midfielder",
    nationality: "Belgium",
    bio: "Maestro playmaker renowned for unmatched passing range, key assists, and long-range shooting prowess.",
    preferredFoot: "Right",
    shirtNumber: 17,
    stats: { goals: 6, assists: 18, appearances: 26, rating: 8.2, passAccuracy: 88.0 }
  },
  {
    playerId: "P005",
    name: "Bukayo Saka",
    age: 23,
    marketValue: 140000000,
    position: "Forward",
    nationality: "England",
    bio: "Dynamic winger with supreme 1v1 dribbling, consistent work rate, and decisive clutch goal contributions.",
    preferredFoot: "Left",
    shirtNumber: 7,
    stats: { goals: 20, assists: 14, appearances: 47, rating: 8.1, passAccuracy: 83.9 }
  },
  {
    playerId: "P006",
    name: "Declan Rice",
    age: 25,
    marketValue: 120000000,
    position: "Midfielder",
    nationality: "England",
    bio: "Powerhouse central defensive midfielder providing defensive solidity, ball progression, and aerial command.",
    preferredFoot: "Right",
    shirtNumber: 41,
    stats: { goals: 7, assists: 9, appearances: 51, rating: 8.0, passAccuracy: 91.4 }
  },
  {
    playerId: "P007",
    name: "Lamine Yamal",
    age: 17,
    marketValue: 120000000,
    position: "Forward",
    nationality: "Spain",
    bio: "Prodigious winger and Euro 2024 winner mesmerizing defenders with effortless technique and visionary play.",
    preferredFoot: "Left",
    shirtNumber: 19,
    stats: { goals: 10, assists: 14, appearances: 50, rating: 8.3, passAccuracy: 85.6 }
  },
  {
    playerId: "P008",
    name: "Pedri",
    age: 21,
    marketValue: 80000000,
    position: "Midfielder",
    nationality: "Spain",
    bio: "Magical midfield architect reminiscent of Iniesta, famous for press resistance and tactical intellect.",
    preferredFoot: "Right",
    shirtNumber: 8,
    stats: { goals: 6, assists: 8, appearances: 34, rating: 7.9, passAccuracy: 92.1 }
  },
  {
    playerId: "P009",
    name: "Vinícius Júnior",
    age: 24,
    marketValue: 180000000,
    position: "Forward",
    nationality: "Brazil",
    bio: "Electric winger and Ballon d'Or contender who tears apart backlines with breathtaking samba skill.",
    preferredFoot: "Right",
    shirtNumber: 7,
    stats: { goals: 26, assists: 11, appearances: 39, rating: 8.6, passAccuracy: 81.7 }
  },
  {
    playerId: "P010",
    name: "Rodri",
    age: 28,
    marketValue: 130000000,
    position: "Midfielder",
    nationality: "Spain",
    bio: "Metronomic defensive midfield engine and tactical anchor, widely acclaimed as the best holding mid in football.",
    preferredFoot: "Right",
    shirtNumber: 16,
    stats: { goals: 9, assists: 14, appearances: 50, rating: 8.5, passAccuracy: 93.8 }
  },
  {
    playerId: "P011",
    name: "William Saliba",
    age: 23,
    marketValue: 80000000,
    position: "Defender",
    nationality: "France",
    bio: "Composed center-back possessing elite recovery pace, positional awareness, and exceptional ball-playing ability.",
    preferredFoot: "Right",
    shirtNumber: 2,
    stats: { goals: 2, assists: 1, appearances: 50, rating: 7.8, passAccuracy: 92.4 }
  },
  {
    playerId: "P012",
    name: "Antonio Rüdiger",
    age: 31,
    marketValue: 25000000,
    position: "Defender",
    nationality: "Germany",
    bio: "Fearless central defender famed for intense physical duels, aerial supremacy, and warrior spirit.",
    preferredFoot: "Right",
    shirtNumber: 22,
    stats: { goals: 3, assists: 2, appearances: 48, rating: 7.7, passAccuracy: 89.9 }
  },
  {
    playerId: "P013",
    name: "Rúben Dias",
    age: 27,
    marketValue: 80000000,
    position: "Defender",
    nationality: "Portugal",
    bio: "Vocal defensive leader organizing high defensive lines with formidable tackling and tactical discipline.",
    preferredFoot: "Right",
    shirtNumber: 3,
    stats: { goals: 1, assists: 1, appearances: 45, rating: 7.8, passAccuracy: 93.1 }
  },
  {
    playerId: "P014",
    name: "Thibaut Courtois",
    age: 32,
    marketValue: 28000000,
    position: "Goalkeeper",
    nationality: "Belgium",
    bio: "Towering shot-stopper capable of impossible reflex saves under extreme Champions League pressure.",
    preferredFoot: "Left",
    shirtNumber: 1,
    stats: { goals: 0, assists: 0, appearances: 12, rating: 8.1, passAccuracy: 80.2 }
  },
  {
    playerId: "P015",
    name: "Ederson",
    age: 31,
    marketValue: 35000000,
    position: "Goalkeeper",
    nationality: "Brazil",
    bio: "Revolutionary sweeping goalkeeper acting as a 11th outfield player with laser-guided long distribution.",
    preferredFoot: "Left",
    shirtNumber: 31,
    stats: { goals: 0, assists: 1, appearances: 43, rating: 7.6, passAccuracy: 86.7 }
  },
  {
    playerId: "P016",
    name: "David Raya",
    age: 29,
    marketValue: 35000000,
    position: "Goalkeeper",
    nationality: "Spain",
    bio: "Golden Glove winning keeper with outstanding cross claim statistics and brave sweep-keeping.",
    preferredFoot: "Right",
    shirtNumber: 22,
    stats: { goals: 0, assists: 0, appearances: 41, rating: 7.7, passAccuracy: 79.8 }
  },
  {
    playerId: "P017",
    name: "Ousmane Dembélé",
    age: 27,
    marketValue: 60000000,
    position: "Forward",
    nationality: "France",
    bio: "Ambidextrous winger with unpredictable cutbacks, lightning acceleration, and key chance generation.",
    preferredFoot: "Both",
    shirtNumber: 10,
    stats: { goals: 5, assists: 14, appearances: 42, rating: 7.9, passAccuracy: 82.5 }
  },
  {
    playerId: "P018",
    name: "Jamal Musiala",
    age: 21,
    marketValue: 130000000,
    position: "Midfielder",
    nationality: "Germany",
    bio: "Silky attacker nicknamed 'Bambi' due to effortless tight-space dribbling and decisive final-third output.",
    preferredFoot: "Right",
    shirtNumber: 42,
    stats: { goals: 12, assists: 8, appearances: 38, rating: 8.2, passAccuracy: 87.3 }
  },
  {
    playerId: "P019",
    name: "Harry Kane",
    age: 31,
    marketValue: 100000000,
    position: "Forward",
    nationality: "England",
    bio: "Lethal clinical striker who drops deep like an elite #10 while consistently scoring 30+ goals per season.",
    preferredFoot: "Right",
    shirtNumber: 9,
    stats: { goals: 44, assists: 12, appearances: 45, rating: 8.6, passAccuracy: 84.8 }
  },
  {
    playerId: "P020",
    name: "Alphonso Davies",
    age: 23,
    marketValue: 50000000,
    position: "Defender",
    nationality: "Canada",
    bio: "Blistering left-back known as the 'Roadrunner' with game-changing recovery speed and attacking overlap.",
    preferredFoot: "Left",
    shirtNumber: 19,
    stats: { goals: 3, assists: 6, appearances: 37, rating: 7.7, passAccuracy: 86.1 }
  }
];

// Neo4j Graph Relationships
const playsForRelationships = [
  { playerId: "P001", teamId: "T001", salary: 20000000, contract_end: "2029-06-30", jersey_number: 5, role: "Starting Midfielder" },
  { playerId: "P002", teamId: "T001", salary: 25000000, contract_end: "2029-06-30", jersey_number: 9, role: "Star Forward" },
  { playerId: "P003", teamId: "T002", salary: 24000000, contract_end: "2027-06-30", jersey_number: 9, role: "Lead Striker" },
  { playerId: "P004", teamId: "T002", salary: 20000000, contract_end: "2025-06-30", jersey_number: 17, role: "Vice Captain" },
  { playerId: "P005", teamId: "T003", salary: 15000000, contract_end: "2027-06-30", jersey_number: 7, role: "Right Winger" },
  { playerId: "P006", teamId: "T003", salary: 14000000, contract_end: "2028-06-30", jersey_number: 41, role: "Midfield Anchor" },
  { playerId: "P007", teamId: "T004", salary: 8000000, contract_end: "2031-06-30", jersey_number: 19, role: "Winger / Wonderkid" },
  { playerId: "P008", teamId: "T004", salary: 9000000, contract_end: "2026-06-30", jersey_number: 8, role: "Central Midfielder" },
  { playerId: "P009", teamId: "T001", salary: 21000000, contract_end: "2027-06-30", jersey_number: 7, role: "Left Winger" },
  { playerId: "P010", teamId: "T002", salary: 16000000, contract_end: "2027-06-30", jersey_number: 16, role: "Defensive Midfielder" },
  { playerId: "P011", teamId: "T003", salary: 11000000, contract_end: "2027-06-30", jersey_number: 2, role: "Starting CB" },
  { playerId: "P012", teamId: "T001", salary: 10000000, contract_end: "2026-06-30", jersey_number: 22, role: "Central Defender" },
  { playerId: "P013", teamId: "T002", salary: 12000000, contract_end: "2027-06-30", jersey_number: 3, role: "Central Defender" },
  { playerId: "P014", teamId: "T001", salary: 13000000, contract_end: "2026-06-30", jersey_number: 1, role: "First-Choice Goalkeeper" },
  { playerId: "P015", teamId: "T002", salary: 9000000, contract_end: "2026-06-30", jersey_number: 31, role: "First-Choice Goalkeeper" },
  { playerId: "P016", teamId: "T003", salary: 7000000, contract_end: "2028-06-30", jersey_number: 22, role: "First-Choice Goalkeeper" },
  { playerId: "P017", teamId: "T005", salary: 14000000, contract_end: "2028-06-30", jersey_number: 10, role: "Starting Winger" },
  { playerId: "P018", teamId: "T006", salary: 12000000, contract_end: "2026-06-30", jersey_number: 42, role: "Attacking Midfielder" },
  { playerId: "P019", teamId: "T006", salary: 25000000, contract_end: "2027-06-30", jersey_number: 9, role: "Star Striker" },
  { playerId: "P020", teamId: "T006", salary: 11000000, contract_end: "2025-06-30", jersey_number: 19, role: "Left Back" }
];

const managesRelationships = [
  { managerId: "M001", teamId: "T001", win_rate: 71.4, hired_date: "2021-06-01", trophies_won: 12 },
  { managerId: "M002", teamId: "T002", win_rate: 72.8, hired_date: "2016-07-01", trophies_won: 17 },
  { managerId: "M003", teamId: "T003", win_rate: 61.2, hired_date: "2019-12-20", trophies_won: 3 },
  { managerId: "M004", teamId: "T004", win_rate: 75.0, hired_date: "2024-05-29", trophies_won: 7 },
  { managerId: "M005", teamId: "T005", win_rate: 66.7, hired_date: "2023-07-05", trophies_won: 4 },
  { managerId: "M006", teamId: "T006", win_rate: 70.0, hired_date: "2024-05-29", trophies_won: 0 }
];

const rivalRelationships = [
  { team1Id: "T001", team2Id: "T004", derby_name: "El Clásico", intensity_score: 9.9, matches_played: 255 },
  { team1Id: "T002", team2Id: "T003", derby_name: "Premier League Title Showdown", intensity_score: 8.8, matches_played: 180 },
  { team1Id: "T001", team2Id: "T002", derby_name: "UEFA Champions League Super Derby", intensity_score: 9.4, matches_played: 12 },
  { team1Id: "T004", team2Id: "T005", derby_name: "Remontada Rivalry", intensity_score: 8.9, matches_played: 14 },
  { team1Id: "T001", team2Id: "T006", derby_name: "European Clásico", intensity_score: 9.2, matches_played: 28 }
];

module.exports = {
  teams,
  managers,
  players,
  playsForRelationships,
  managesRelationships,
  rivalRelationships
};
