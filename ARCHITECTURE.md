# 🏗️ Football Team Management System - Architecture & Polyglot Design

## 1. System Architecture Overview

The system is built as a **Polyglot Persistence Web Application** designed for university database coursework. It combines the strengths of two distinct database paradigms:

1. **MongoDB (Document Store)**: Manages heavy attribute catalog data (Player bio, age, market value, position, stats, stadium budget, history).
2. **Neo4j (Graph Database)**: Manages complex interconnectivity between entities using graph nodes and relationship edges (`:PLAYS_FOR`, `:MANAGES`, `:RIVAL_OF`).

```
+-----------------------------------------------------------------------------------+
|                                 WEB FRONTEND                                      |
|  (E-Commerce Sidebar, Sort Dropdown, Native DOMParser XML Reader, Graph Canvas)   |
+-----------------------------------------------------------------------------------+
                                         │
                                  HTTP GET (XML)
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND                                   |
|   /api/search-players (Parses Filters -> Fetches DBs -> Merges -> Serializes XML) |
+-----------------------------------------------------------------------------------+
                     │                                   │
       1. NoSQL $match / $sort              2. Cypher MATCH / WHERE
                     │                                   │
                     ▼                                   ▼
+-------------------------+                 +-------------------------+
|     MONGODB DATABASE    |                 |     NEO4J GRAPH DB      |
| (Player/Team Catalog)   |                 |  (Entity Relationships) |
+-------------------------+                 +-------------------------+
```

---

## 2. Polyglot Database Schemas

### A. MongoDB Document Store Schemas

#### Collection: `players`
```json
{
  "_id": "ObjectId(...)",
  "playerId": "P001",
  "name": "Jude Bellingham",
  "age": 21,
  "marketValue": 180000000,
  "position": "Midfielder",
  "nationality": "England",
  "bio": "Sensational complete midfielder...",
  "photoUrl": "https://...",
  "preferredFoot": "Right",
  "shirtNumber": 5,
  "stats": {
    "goals": 23,
    "assists": 12,
    "appearances": 42,
    "rating": 8.4,
    "passAccuracy": 89.2
  }
}
```

#### Collection: `teams`
```json
{
  "_id": "ObjectId(...)",
  "teamId": "T001",
  "teamName": "Real Madrid",
  "stadium": "Santiago Bernabéu",
  "budget": 850000000,
  "history": "Founded in 1902...",
  "league": "La Liga",
  "city": "Madrid",
  "country": "Spain"
}
```

---

### B. Neo4j Graph Database Schema

```
(:Player {id, name, position, nationality})
    │
    │  [:PLAYS_FOR {salary, contract_end, jersey_number, role}]
    ▼
(:Team {id, name, stadium, league}) ◄─── [:RIVAL_OF {derby_name, intensity_score}] ───► (:Team)
    ▲
    │  [:MANAGES {win_rate, hired_date, trophies_won}]
    │
(:Manager {id, name, nationality})
```

#### Graph Relationships:
1. `(Player)-[:PLAYS_FOR {salary: 20000000, contract_end: "2029-06-30"}]->(Team)`
2. `(Manager)-[:MANAGES {win_rate: 71.4, hired_date: "2021-06-01"}]->(Team)`
3. `(Team)-[:RIVAL_OF {derby_name: "El Clásico", intensity_score: 9.9}]->(Team)`

---

## 3. Data Integration using XML

Both databases are queried independently in the backend. Their results are combined into memory and serialized into a single XML response payload:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<football_management_system timestamp="2026-10-07T12:00:00Z" total_players="1">
  <polyglot_metadata>
    <database_status mongo_mode="live" neo4j_mode="live"/>
    <mongo_execution_plan collection="players">
      <find_filter>{"position":{"$in":["Midfielder"]}}</find_filter>
      <sort_order>{"marketValue":-1}</sort_order>
    </mongo_execution_plan>
    <neo4j_execution_plan>
      <cypher_query>MATCH (p:Player)-[r:PLAYS_FOR]->(t:Team) WHERE p.id IN $playerIds...</cypher_query>
    </neo4j_execution_plan>
  </polyglot_metadata>

  <player_catalog>
    <player id="P001" position="Midfielder" nationality="England">
      <!-- MongoDB Document Catalog Attributes -->
      <mongo_document_attributes>
        <name>Jude Bellingham</name>
        <age>21</age>
        <market_value currency="EUR" formatted="€180,000,000">180000000</market_value>
        <bio>Sensational complete midfielder...</bio>
        <performance_stats>
          <goals>23</goals>
          <assists>12</assists>
          <rating>8.4</rating>
        </performance_stats>
      </mongo_document_attributes>

      <!-- Neo4j Graph Relationships -->
      <neo4j_graph_relationships>
        <plays_for_relationship>
          <team id="T001">
            <name>Real Madrid</name>
            <stadium>Santiago Bernabéu</stadium>
          </team>
          <contract>
            <salary currency="EUR" formatted="€20,000,000/yr">20000000</salary>
            <contract_end>2029-06-30</contract_end>
          </contract>
        </plays_for_relationship>

        <manages_relationship>
          <manager id="M001">
            <name>Carlo Ancelotti</name>
            <win_rate>71.4%</win_rate>
          </manager>
        </manages_relationship>

        <team_rivalries>
          <rival_of>
            <rival_team id="T004">FC Barcelona</rival_team>
            <derby_name>El Clásico</derby_name>
          </rival_of>
        </team_rivalries>
      </neo4j_graph_relationships>
    </player>
  </player_catalog>
</football_management_system>
```

---

## 4. Single-Query Integration Flow (For Professor Review)

1. **User Action**: Student selects filter options (Position: Forward, Age: 18-25) in UI.
2. **Frontend AJAX**: Sends GET to `/api/search-players?positions=Forward&minAge=18&maxAge=25`.
3. **MongoDB Fetch**: Backend queries Mongo for catalog attributes using `$match` & `$sort`.
4. **Neo4j Fetch**: Backend takes matching player IDs and queries Neo4j using Cypher `MATCH (p)-[:PLAYS_FOR]->(t)`.
5. **Polyglot Fusion**: Express backend merges document attributes + graph relationships into a single memory model.
6. **XML Serialization**: `xmlbuilder2` converts memory model to well-formed XML string.
7. **HTTP Response**: Sent with `Content-Type: application/xml`.
8. **Frontend Render**: Browser receives XML string, parses it natively via `window.DOMParser()`, and renders dynamic cards.
