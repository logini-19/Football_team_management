# ⚽ Football Team Management System (Polyglot Database & XML Integration)

> **University Project Submission**  
> **Course**: Advanced Database Systems / Web Engineering  
> **Technologies**: Node.js, Express, MongoDB (Document Store), Neo4j (Graph Database), XML Data Integration, Vanilla JS (DOMParser), CSS Glassmorphism.

---

## 🌟 Key System Features

1. **Polyglot Persistence Architecture**:
   - **MongoDB (Document Store)**: Stores heavy entity attributes acting as the catalog (`Name`, `Age`, `Market Value`, `Position`, `Nationality`, `Bio`, `Stats`).
   - **Neo4j (Graph Database)**: Stores inter-entity relationships:
     - `(Player)-[:PLAYS_FOR {salary, contract_end}]->(Team)`
     - `(Team)-[:RIVAL_OF {derby_name}]->(Team)`
     - `(Manager)-[:MANAGES {win_rate, hired_date}]->(Team)`

2. **E-Commerce Style UI (Sidebar Filters & Sort)**:
   - Checkboxes for **Position** (Forward, Midfielder, Defender, Goalkeeper).
   - Checkboxes for **Nationality** (England, Spain, France, Brazil, Germany, etc.).
   - Range filter for **Age** (e.g. 18-35).
   - Sort dropdown for **Market Value** (High-to-Low / Low-to-High), **Name** (A-Z), **Age**.

3. **Strict University Requirements (XML Data Integration)**:
   - Backend queries both MongoDB and Neo4j, merges the attribute & graph data into memory, and serializes the result into **XML format** (`application/xml`).
   - Frontend receives the raw XML and parses it natively using `window.DOMParser()`.
   - **Professor Inspection Tools**:
     - 📄 **Inspect Raw XML Payload**: Inspect the exact XML returned over HTTP.
     - 🔍 **Polyglot Execution Plan**: View the exact MongoDB `$match`/`$sort` query and Neo4j Cypher query.
     - 🕸️ **Interactive Graph Visualizer**: View an interactive canvas graph of Nodes and Edges.

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Setup (`.env`)
Create or edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/football_management
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```
*(Note: If local Mongo or Neo4j databases are offline, the application automatically engages a built-in emulator mode so the project runs out-of-the-box!)*

### 3. Database Seeding Commands
To populate both databases with rich sample data (Real Madrid, Man City, Arsenal, Barcelona, Mbappé, Bellingham, Haaland, etc.):
```bash
# Seed both MongoDB and Neo4j
npm run seed

# Seed MongoDB only
npm run seed:mongo
```
*Raw Cypher Seed Script for Neo4j Browser / cypher-shell*: [`scripts/seed-neo4j.cypher`](file:///Users/loginits/Projects/Football_team_management/scripts/seed-neo4j.cypher)

### 4. Running the Application
Start the server:
```bash
npm start
```
Access the application in your browser:
- **Web App UI**: [http://localhost:5000](http://localhost:5000)
- **Primary XML Endpoint**: [http://localhost:5000/api/search-players](http://localhost:5000/api/search-players)
- **Graph Visualizer API**: [http://localhost:5000/api/graph](http://localhost:5000/api/graph)

---

## 🎓 How to Present to Your Professor

1. **Demonstrate E-Commerce Filters**:
   - Open [http://localhost:5000](http://localhost:5000).
   - Check "Forward" and "Midfielder" in the sidebar. Select "Market Value (High to Low)".
   - Explain how the backend dynamically constructs a MongoDB `$match` clause and Neo4j Cypher `MATCH (p)-[:PLAYS_FOR]->(t)` query.

2. **Demonstrate XML Data Integration**:
   - Click **"📄 Inspect Raw XML Payload"** in the top navigation bar.
   - Show your professor the clean, well-formed `<football_management_system>` XML tree containing `<mongo_document_attributes>` and `<neo4j_graph_relationships>`.
   - Point out [`server/routes/api.js`](file:///Users/loginits/Projects/Football_team_management/server/routes/api.js) where step-by-step professor comments detail the 6-step integration pipeline.

3. **Demonstrate Graph Visualizer**:
   - Click **"🕸️ Graph View"** to display the interactive HTML5 canvas graph illustrating the Nodes (`Player`, `Team`, `Manager`) and Edges (`:PLAYS_FOR`, `:MANAGES`, `:RIVAL_OF`).
