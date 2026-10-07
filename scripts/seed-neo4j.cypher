// =====================================================================================
// POLYGLOT PERSISTENCE: NEO4J GRAPH DATABASE SCHEMA & SEED SCRIPT
// =====================================================================================
// Relationships stored:
// 1. (Player)-[:PLAYS_FOR {salary, contract_end}]->(Team)
// 2. (Manager)-[:MANAGES {win_rate, hired_date}]->(Team)
// 3. (Team)-[:RIVAL_OF {derby_name}]->(Team)
// =====================================================================================

// 1. Clear Existing Graph
MATCH (n) DETACH DELETE n;

// 2. Create Team Nodes
CREATE (:Team {id: 'T001', name: 'Real Madrid', stadium: 'Santiago Bernabéu', league: 'La Liga'});
CREATE (:Team {id: 'T002', name: 'Manchester City', stadium: 'Etihad Stadium', league: 'Premier League'});
CREATE (:Team {id: 'T003', name: 'Arsenal FC', stadium: 'Emirates Stadium', league: 'Premier League'});
CREATE (:Team {id: 'T004', name: 'FC Barcelona', stadium: 'Spotify Camp Nou', league: 'La Liga'});
CREATE (:Team {id: 'T005', name: 'Paris Saint-Germain', stadium: 'Parc des Princes', league: 'Ligue 1'});
CREATE (:Team {id: 'T006', name: 'FC Bayern Munich', stadium: 'Allianz Arena', league: 'Bundesliga'});

// 3. Create Manager Nodes
CREATE (:Manager {id: 'M001', name: 'Carlo Ancelotti', nationality: 'Italy'});
CREATE (:Manager {id: 'M002', name: 'Pep Guardiola', nationality: 'Spain'});
CREATE (:Manager {id: 'M003', name: 'Mikel Arteta', nationality: 'Spain'});
CREATE (:Manager {id: 'M004', name: 'Hansi Flick', nationality: 'Germany'});
CREATE (:Manager {id: 'M005', name: 'Luis Enrique', nationality: 'Spain'});
CREATE (:Manager {id: 'M006', name: 'Vincent Kompany', nationality: 'Belgium'});

// 4. Create Player Nodes
CREATE (:Player {id: 'P001', name: 'Jude Bellingham', position: 'Midfielder', nationality: 'England'});
CREATE (:Player {id: 'P002', name: 'Kylian Mbappé', position: 'Forward', nationality: 'France'});
CREATE (:Player {id: 'P003', name: 'Erling Haaland', position: 'Forward', nationality: 'Norway'});
CREATE (:Player {id: 'P004', name: 'Kevin De Bruyne', position: 'Midfielder', nationality: 'Belgium'});
CREATE (:Player {id: 'P005', name: 'Bukayo Saka', position: 'Forward', nationality: 'England'});
CREATE (:Player {id: 'P006', name: 'Declan Rice', position: 'Midfielder', nationality: 'England'});
CREATE (:Player {id: 'P007', name: 'Lamine Yamal', position: 'Forward', nationality: 'Spain'});
CREATE (:Player {id: 'P008', name: 'Pedri', position: 'Midfielder', nationality: 'Spain'});
CREATE (:Player {id: 'P009', name: 'Vinícius Júnior', position: 'Forward', nationality: 'Brazil'});
CREATE (:Player {id: 'P010', name: 'Rodri', position: 'Midfielder', nationality: 'Spain'});
CREATE (:Player {id: 'P011', name: 'William Saliba', position: 'Defender', nationality: 'France'});
CREATE (:Player {id: 'P012', name: 'Antonio Rüdiger', position: 'Defender', nationality: 'Germany'});
CREATE (:Player {id: 'P013', name: 'Rúben Dias', position: 'Defender', nationality: 'Portugal'});
CREATE (:Player {id: 'P014', name: 'Thibaut Courtois', position: 'Goalkeeper', nationality: 'Belgium'});
CREATE (:Player {id: 'P015', name: 'Ederson', position: 'Goalkeeper', nationality: 'Brazil'});
CREATE (:Player {id: 'P016', name: 'David Raya', position: 'Goalkeeper', nationality: 'Spain'});
CREATE (:Player {id: 'P017', name: 'Ousmane Dembélé', position: 'Forward', nationality: 'France'});
CREATE (:Player {id: 'P018', name: 'Jamal Musiala', position: 'Midfielder', nationality: 'Germany'});
CREATE (:Player {id: 'P019', name: 'Harry Kane', position: 'Forward', nationality: 'England'});
CREATE (:Player {id: 'P020', name: 'Alphonso Davies', position: 'Defender', nationality: 'Canada'});

// 5. Create :MANAGES Relationships (Manager -> Team)
MATCH (m:Manager {id: 'M001'}), (t:Team {id: 'T001'}) CREATE (m)-[:MANAGES {win_rate: 71.4, hired_date: '2021-06-01', trophies_won: 12}]->(t);
MATCH (m:Manager {id: 'M002'}), (t:Team {id: 'T002'}) CREATE (m)-[:MANAGES {win_rate: 72.8, hired_date: '2016-07-01', trophies_won: 17}]->(t);
MATCH (m:Manager {id: 'M003'}), (t:Team {id: 'T003'}) CREATE (m)-[:MANAGES {win_rate: 61.2, hired_date: '2019-12-20', trophies_won: 3}]->(t);
MATCH (m:Manager {id: 'M004'}), (t:Team {id: 'T004'}) CREATE (m)-[:MANAGES {win_rate: 75.0, hired_date: '2024-05-29', trophies_won: 7}]->(t);
MATCH (m:Manager {id: 'M005'}), (t:Team {id: 'T005'}) CREATE (m)-[:MANAGES {win_rate: 66.7, hired_date: '2023-07-05', trophies_won: 4}]->(t);
MATCH (m:Manager {id: 'M006'}), (t:Team {id: 'T006'}) CREATE (m)-[:MANAGES {win_rate: 70.0, hired_date: '2024-05-29', trophies_won: 0}]->(t);

// 6. Create :PLAYS_FOR Relationships (Player -> Team)
MATCH (p:Player {id: 'P001'}), (t:Team {id: 'T001'}) CREATE (p)-[:PLAYS_FOR {salary: 20000000, contract_end: '2029-06-30', jersey_number: 5, role: 'Starting Midfielder'}]->(t);
MATCH (p:Player {id: 'P002'}), (t:Team {id: 'T001'}) CREATE (p)-[:PLAYS_FOR {salary: 25000000, contract_end: '2029-06-30', jersey_number: 9, role: 'Star Forward'}]->(t);
MATCH (p:Player {id: 'P003'}), (t:Team {id: 'T002'}) CREATE (p)-[:PLAYS_FOR {salary: 24000000, contract_end: '2027-06-30', jersey_number: 9, role: 'Lead Striker'}]->(t);
MATCH (p:Player {id: 'P004'}), (t:Team {id: 'T002'}) CREATE (p)-[:PLAYS_FOR {salary: 20000000, contract_end: '2025-06-30', jersey_number: 17, role: 'Vice Captain'}]->(t);
MATCH (p:Player {id: 'P005'}), (t:Team {id: 'T003'}) CREATE (p)-[:PLAYS_FOR {salary: 15000000, contract_end: '2027-06-30', jersey_number: 7, role: 'Right Winger'}]->(t);
MATCH (p:Player {id: 'P006'}), (t:Team {id: 'T003'}) CREATE (p)-[:PLAYS_FOR {salary: 14000000, contract_end: '2028-06-30', jersey_number: 41, role: 'Midfield Anchor'}]->(t);
MATCH (p:Player {id: 'P007'}), (t:Team {id: 'T004'}) CREATE (p)-[:PLAYS_FOR {salary: 8000000, contract_end: '2031-06-30', jersey_number: 19, role: 'Winger / Wonderkid'}]->(t);
MATCH (p:Player {id: 'P008'}), (t:Team {id: 'T004'}) CREATE (p)-[:PLAYS_FOR {salary: 9000000, contract_end: '2026-06-30', jersey_number: 8, role: 'Central Midfielder'}]->(t);
MATCH (p:Player {id: 'P009'}), (t:Team {id: 'T001'}) CREATE (p)-[:PLAYS_FOR {salary: 21000000, contract_end: '2027-06-30', jersey_number: 7, role: 'Left Winger'}]->(t);
MATCH (p:Player {id: 'P010'}), (t:Team {id: 'T002'}) CREATE (p)-[:PLAYS_FOR {salary: 16000000, contract_end: '2027-06-30', jersey_number: 16, role: 'Defensive Midfielder'}]->(t);
MATCH (p:Player {id: 'P011'}), (t:Team {id: 'T003'}) CREATE (p)-[:PLAYS_FOR {salary: 11000000, contract_end: '2027-06-30', jersey_number: 2, role: 'Starting CB'}]->(t);
MATCH (p:Player {id: 'P012'}), (t:Team {id: 'T001'}) CREATE (p)-[:PLAYS_FOR {salary: 10000000, contract_end: '2026-06-30', jersey_number: 22, role: 'Central Defender'}]->(t);
MATCH (p:Player {id: 'P013'}), (t:Team {id: 'T002'}) CREATE (p)-[:PLAYS_FOR {salary: 12000000, contract_end: '2027-06-30', jersey_number: 3, role: 'Central Defender'}]->(t);
MATCH (p:Player {id: 'P014'}), (t:Team {id: 'T001'}) CREATE (p)-[:PLAYS_FOR {salary: 13000000, contract_end: '2026-06-30', jersey_number: 1, role: 'First-Choice Goalkeeper'}]->(t);
MATCH (p:Player {id: 'P015'}), (t:Team {id: 'T002'}) CREATE (p)-[:PLAYS_FOR {salary: 9000000, contract_end: '2026-06-30', jersey_number: 31, role: 'First-Choice Goalkeeper'}]->(t);
MATCH (p:Player {id: 'P016'}), (t:Team {id: 'T003'}) CREATE (p)-[:PLAYS_FOR {salary: 7000000, contract_end: '2028-06-30', jersey_number: 22, role: 'First-Choice Goalkeeper'}]->(t);
MATCH (p:Player {id: 'P017'}), (t:Team {id: 'T005'}) CREATE (p)-[:PLAYS_FOR {salary: 14000000, contract_end: '2028-06-30', jersey_number: 10, role: 'Starting Winger'}]->(t);
MATCH (p:Player {id: 'P018'}), (t:Team {id: 'T006'}) CREATE (p)-[:PLAYS_FOR {salary: 12000000, contract_end: '2026-06-30', jersey_number: 42, role: 'Attacking Midfielder'}]->(t);
MATCH (p:Player {id: 'P019'}), (t:Team {id: 'T006'}) CREATE (p)-[:PLAYS_FOR {salary: 25000000, contract_end: '2027-06-30', jersey_number: 9, role: 'Star Striker'}]->(t);
MATCH (p:Player {id: 'P020'}), (t:Team {id: 'T006'}) CREATE (p)-[:PLAYS_FOR {salary: 11000000, contract_end: '2025-06-30', jersey_number: 19, role: 'Left Back'}]->(t);

// 7. Create :RIVAL_OF Relationships (Team <-> Team)
MATCH (t1:Team {id: 'T001'}), (t2:Team {id: 'T004'}) CREATE (t1)-[:RIVAL_OF {derby_name: 'El Clásico', intensity_score: 9.9, matches_played: 255}]->(t2), (t2)-[:RIVAL_OF {derby_name: 'El Clásico', intensity_score: 9.9, matches_played: 255}]->(t1);
MATCH (t1:Team {id: 'T002'}), (t2:Team {id: 'T003'}) CREATE (t1)-[:RIVAL_OF {derby_name: 'Premier League Title Showdown', intensity_score: 8.8, matches_played: 180}]->(t2), (t2)-[:RIVAL_OF {derby_name: 'Premier League Title Showdown', intensity_score: 8.8, matches_played: 180}]->(t1);
MATCH (t1:Team {id: 'T001'}), (t2:Team {id: 'T002'}) CREATE (t1)-[:RIVAL_OF {derby_name: 'UEFA Champions League Super Derby', intensity_score: 9.4, matches_played: 12}]->(t2), (t2)-[:RIVAL_OF {derby_name: 'UEFA Champions League Super Derby', intensity_score: 9.4, matches_played: 12}]->(t1);
MATCH (t1:Team {id: 'T004'}), (t2:Team {id: 'T005'}) CREATE (t1)-[:RIVAL_OF {derby_name: 'Remontada Rivalry', intensity_score: 8.9, matches_played: 14}]->(t2), (t2)-[:RIVAL_OF {derby_name: 'Remontada Rivalry', intensity_score: 8.9, matches_played: 14}]->(t1);
MATCH (t1:Team {id: 'T001'}), (t2:Team {id: 'T006'}) CREATE (t1)-[:RIVAL_OF {derby_name: 'European Clásico', intensity_score: 9.2, matches_played: 28}]->(t2), (t2)-[:RIVAL_OF {derby_name: 'European Clásico', intensity_score: 9.2, matches_played: 28}]->(t1);

// Verify Seed Count
MATCH (n) RETURN labels(n) AS EntityType, count(n) AS Count;
