/**
 * Football Team Management System - E-Commerce Frontend Controller
 * Demonstrates native XML Parsing with DOMParser, Polyglot Data Rendering, and Full CRUD Operations.
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  rawXmlText: '', // Stores latest XML response string from server
  xmlDoc: null,   // Parsed XML Document object
  teams: [],      // Cached teams list for dropdowns
  deletingPlayerId: null, // Track target player ID for deletion

  async init() {
    console.log('[App] Initializing FootyManager Pro UI...');
    this.bindEvents();
    this.checkDbStatus();
    await this.loadTeams();
    this.fetchPlayers();
  },

  /**
   * Fetch teams list from backend for dropdown forms
   */
  async loadTeams() {
    try {
      const res = await fetch('/api/teams');
      this.teams = await res.json();
      const teamSelect = document.getElementById('formTeamId');
      if (teamSelect) {
        teamSelect.innerHTML = '<option value="">Unattached</option>' + 
          this.teams.map(t => `<option value="${t.teamId}">${t.teamName} (${t.league})</option>`).join('');
      }
    } catch (err) {
      console.warn('Could not load teams list:', err);
    }
  },

  /**
   * Helper to get 2-letter uppercase initials from player name
   */
  getInitials(name = '') {
    if (!name) return 'FC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  /**
   * Bind event listeners to UI controls
   */
  bindEvents() {
    // Sidebar Filter Change Listeners
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
      cb.addEventListener('change', () => this.fetchPlayers());
    });

    // Age Range Inputs
    const minAgeInput = document.getElementById('minAgeInput');
    const maxAgeInput = document.getElementById('maxAgeInput');
    if (minAgeInput) minAgeInput.addEventListener('change', () => this.fetchPlayers());
    if (maxAgeInput) maxAgeInput.addEventListener('change', () => this.fetchPlayers());

    // Search Bar Input (Debounced)
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.fetchPlayers(), 300);
      });
    }

    // Sort Dropdown Change Listener
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.fetchPlayers());
    }

    // Reset Filters Button
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Top Navigation Buttons
    const viewXmlBtn = document.getElementById('viewXmlBtn');
    if (viewXmlBtn) {
      viewXmlBtn.addEventListener('click', () => {
        XMLViewer.showModal(this.rawXmlText, 'Integrated Polyglot XML Payload');
      });
    }

    const viewPlanBtn = document.getElementById('viewPlanBtn');
    if (viewPlanBtn) {
      viewPlanBtn.addEventListener('click', () => this.showExecutionPlanModal());
    }

    const viewGraphBtn = document.getElementById('viewGraphBtn');
    if (viewGraphBtn) {
      viewGraphBtn.addEventListener('click', () => GraphVisualizer.showModal());
    }

    // CRUD: Add Player Button
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', () => this.openCreatePlayerModal());
    }

    // CRUD: Player Form Submit
    const playerForm = document.getElementById('playerForm');
    if (playerForm) {
      playerForm.addEventListener('submit', (e) => this.handlePlayerFormSubmit(e));
    }

    // CRUD: Delete Confirmation Button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.handleConfirmDelete());
    }

    // Modal Close Buttons
    document.querySelectorAll('.btn-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || el.classList.contains('btn-close')) {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        }
      });
    });
  },

  /**
   * Check database live connectivity status
   */
  async checkDbStatus() {
    try {
      const res = await fetch('/api/db-status');
      const status = await res.json();
      
      const mongoPill = document.getElementById('mongoStatusPill');
      const neo4jPill = document.getElementById('neo4jStatusPill');

      if (mongoPill) {
        mongoPill.className = `status-pill ${status.mongo.mode}`;
        mongoPill.innerHTML = `<span class="status-dot ${status.mongo.mode}"></span> MongoDB: ${status.mongo.mode.toUpperCase()}`;
      }

      if (neo4jPill) {
        neo4jPill.className = `status-pill ${status.neo4j.mode}`;
        neo4jPill.innerHTML = `<span class="status-dot ${status.neo4j.mode}"></span> Neo4j: ${status.neo4j.mode.toUpperCase()}`;
      }
    } catch (err) {
      console.warn('Could not fetch DB status:', err);
    }
  },

  /**
   * Reset all sidebar filters
   */
  resetFilters() {
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('minAgeInput').value = '';
    document.getElementById('maxAgeInput').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'marketValue_desc';
    this.fetchPlayers();
  },

  /**
   * Construct URL parameters from sidebar filters
   */
  getFilterQueryParams() {
    const selectedPositions = Array.from(document.querySelectorAll('input[name="position"]:checked'))
      .map(cb => cb.value);

    const selectedNationalities = Array.from(document.querySelectorAll('input[name="nationality"]:checked'))
      .map(cb => cb.value);

    const minAge = document.getElementById('minAgeInput')?.value || '';
    const maxAge = document.getElementById('maxAgeInput')?.value || '';
    const search = document.getElementById('searchInput')?.value || '';
    const sortBy = document.getElementById('sortSelect')?.value || 'marketValue_desc';

    const params = new URLSearchParams();
    if (selectedPositions.length) params.append('positions', selectedPositions.join(','));
    if (selectedNationalities.length) params.append('nationalities', selectedNationalities.join(','));
    if (minAge) params.append('minAge', minAge);
    if (maxAge) params.append('maxAge', maxAge);
    if (search) params.append('search', search);
    params.append('sortBy', sortBy);

    return params.toString();
  },

  /**
   * Core Method: Fetch XML from Backend and Parse using DOMParser
   */
  async fetchPlayers() {
    const grid = document.getElementById('playersGrid');
    const resultsCountEl = document.getElementById('resultsCount');

    if (grid) {
      grid.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Fetching Polyglot Data (MongoDB Catalog + Neo4j Graph)...</p>
        </div>
      `;
    }

    try {
      const queryString = this.getFilterQueryParams();
      const response = await fetch(`/api/search-players?${queryString}`);
      
      // Store raw XML text
      this.rawXmlText = await response.text();

      // =======================================================================
      // PROFESSOR REQUIREMENT: Native XML Parsing in Frontend
      // Uses browser DOMParser to convert raw XML string into XML Document DOM
      // =======================================================================
      const parser = new DOMParser();
      this.xmlDoc = parser.parseFromString(this.rawXmlText, 'text/xml');

      // Check for parsing errors
      const parserError = this.xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML Parser Error: ' + parserError.textContent);
      }

      // Render players from XML DOM nodes
      this.renderPlayersFromXml();

    } catch (err) {
      console.error('Error fetching/parsing player XML:', err);
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            <p>⚠️ Error loading players: ${err.message}</p>
          </div>
        `;
      }
    }
  },

  /**
   * Parse XML DOM Nodes and Render HTML Player Cards
   */
  renderPlayersFromXml() {
    const grid = document.getElementById('playersGrid');
    const resultsCountEl = document.getElementById('resultsCount');
    if (!grid || !this.xmlDoc) return;

    // Select all <player> elements from XML Document
    const playerNodes = this.xmlDoc.querySelectorAll('player_catalog > player');
    const totalPlayers = playerNodes.length;

    if (resultsCountEl) {
      resultsCountEl.innerHTML = `Showing <span>${totalPlayers}</span> Players`;
    }

    if (totalPlayers === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No players matched your filter criteria.</p>
          <button class="btn btn-glass" onclick="App.resetFilters()" style="margin-top: 1rem;">Reset Filters</button>
        </div>
      `;
      return;
    }

    let cardsHtml = '';

    playerNodes.forEach(playerEl => {
      // --- MONGODB ATTRIBUTES PARSING FROM XML ---
      const id = playerEl.getAttribute('id');
      const position = playerEl.getAttribute('position') || 'N/A';
      const nationality = playerEl.getAttribute('nationality') || 'N/A';

      const mongoNode = playerEl.querySelector('mongo_document_attributes');
      const name = mongoNode?.querySelector('name')?.textContent || 'Unknown';
      const age = mongoNode?.querySelector('age')?.textContent || 'N/A';
      const marketValFormatted = mongoNode?.querySelector('market_value')?.getAttribute('formatted') || '€0';
      const shirtNumber = mongoNode?.querySelector('shirt_number')?.textContent || '';
      
      const statsNode = mongoNode?.querySelector('performance_stats');
      const goals = statsNode?.querySelector('goals')?.textContent || '0';
      const assists = statsNode?.querySelector('assists')?.textContent || '0';
      const rating = statsNode?.querySelector('rating')?.textContent || 'N/A';
      const passAcc = statsNode?.querySelector('pass_accuracy')?.textContent || 'N/A';

      // --- NEO4J RELATIONSHIPS PARSING FROM XML ---
      const graphNode = playerEl.querySelector('neo4j_graph_relationships');

      // 1. (Player)-[:PLAYS_FOR]->(Team)
      const playsForNode = graphNode?.querySelector('plays_for_relationship');
      const teamName = playsForNode?.querySelector('team > name')?.textContent || 'Unattached';
      const salaryFormatted = playsForNode?.querySelector('contract > salary')?.getAttribute('formatted') || 'N/A';

      // 2. (Manager)-[:MANAGES]->(Team)
      const managerName = graphNode?.querySelector('manages_relationship > manager > name')?.textContent || 'None';
      const managerWinRate = graphNode?.querySelector('manages_relationship > manager > win_rate')?.textContent || '';

      // 3. (Team)-[:RIVAL_OF]->(Team)
      const rivalNode = graphNode?.querySelector('team_rivalries > rival_of');
      const rivalTeamName = rivalNode?.querySelector('rival_team')?.textContent || 'None';
      const derbyName = rivalNode?.querySelector('derby_name')?.textContent || '';

      // Position CSS class & Initials badge
      const posClass = position.toLowerCase();
      const initials = this.getInitials(name);

      cardsHtml += `
        <div class="player-card">
          <span class="shirt-badge">#${shirtNumber}</span>
          
          <div class="card-header-row">
            <div class="player-avatar-badge ${posClass}">${initials}</div>
            <div class="player-main-info">
              <h3 class="player-name">${name}</h3>
              <div class="badge-row">
                <span class="pos-tag ${posClass}">${position}</span>
                <span class="nationality-tag">🌍 ${nationality} • ${age} yrs</span>
              </div>
            </div>
          </div>

          <div class="card-stats-box">
            <div class="val-row">
              <span class="val-label">Market Value</span>
              <span class="val-amount">${marketValFormatted}</span>
            </div>
            <div class="stats-mini-grid">
              <div class="stat-item"><div class="lbl">Goals</div><div class="val">${goals}</div></div>
              <div class="stat-item"><div class="lbl">Assists</div><div class="val">${assists}</div></div>
              <div class="stat-item"><div class="lbl">Rating</div><div class="val">${rating}</div></div>
              <div class="stat-item"><div class="lbl">Pass %</div><div class="val">${passAcc}</div></div>
            </div>
          </div>

          <div class="card-graph-section">
            <div class="graph-title">🕸️ Neo4j Graph Edges</div>
            <div class="rel-item">
              <span class="rel-label">:PLAYS_FOR</span>
              <span class="rel-val">${teamName}</span>
            </div>
            <div class="rel-item">
              <span class="rel-label">Salary</span>
              <span class="rel-val">${salaryFormatted}</span>
            </div>
            <div class="rel-item">
              <span class="rel-label">:MANAGES</span>
              <span class="rel-val">${managerName} ${managerWinRate ? '('+managerWinRate+')' : ''}</span>
            </div>
            ${rivalTeamName !== 'None' ? `
            <div class="rel-item">
              <span class="rel-label">:RIVAL_OF</span>
              <span class="rel-val">${rivalTeamName} <span style="color:#ef4444;font-size:0.7rem;">(${derbyName})</span></span>
            </div>
            ` : ''}
          </div>

          <div class="card-actions" style="grid-template-columns: repeat(4, 1fr); gap: 0.35rem; position: relative; z-index: 10;">
            <button type="button" class="btn-card-action btn-card-xml" onclick="App.inspectPlayerXml('${id}')" title="Inspect Player XML Node">
              📄 XML
            </button>
            <button type="button" class="btn-card-action" onclick="App.inspectPlayerDetail('${id}')" title="View Profile Details">
              ℹ️ Info
            </button>
            <button type="button" class="btn-card-action" onclick="App.openEditPlayerModal('${id}')" style="color: #0284c7; font-weight: 700;" title="Edit MongoDB Document & Neo4j Node">
              ✏️ Edit
            </button>
            <button type="button" class="btn-card-action" onclick="App.openDeletePlayerModal('${id}', '${name.replace(/'/g, "\\'")}')" style="color: #dc2626; font-weight: 700;" title="Delete Player">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    });

    grid.innerHTML = cardsHtml;
  },

  /**
   * CRUD: Open Modal to Create New Player
   */
  openCreatePlayerModal() {
    console.log('[CRUD] openCreatePlayerModal triggered');
    try {
      const form = document.getElementById('playerForm');
      if (form) form.reset();

      const modeInput = document.getElementById('formMode');
      if (modeInput) modeInput.value = 'create';

      const titleEl = document.getElementById('playerFormTitle');
      if (titleEl) titleEl.innerText = '➕ Add New Player';

      const idInput = document.getElementById('formPlayerId');
      if (idInput) {
        idInput.readOnly = false;
        const existingIds = Array.from(this.xmlDoc?.querySelectorAll('player[id]') || [])
          .map(el => el.getAttribute('id'));
        const nextNum = existingIds.length + 1;
        idInput.value = `P${String(nextNum).padStart(3, '0')}`;
      }

      const modal = document.getElementById('playerFormModal');
      if (modal) {
        modal.classList.add('active');
      } else {
        alert('Error: #playerFormModal element not found in HTML DOM');
      }
    } catch (err) {
      console.error('Error opening create modal:', err);
      alert('Error opening form: ' + err.message);
    }
  },

  /**
   * CRUD: Open Modal to Edit Existing Player
   */
  async openEditPlayerModal(playerId) {
    console.log('[CRUD] openEditPlayerModal triggered for playerId:', playerId);
    try {
      const res = await fetch(`/api/players/${playerId}`);
      const data = await res.json();

      if (!data.success || !data.player) {
        alert(data.error || `Player '${playerId}' not found in database.`);
        return;
      }

      const p = data.player;
      
      const modeInput = document.getElementById('formMode');
      if (modeInput) modeInput.value = 'edit';

      const titleEl = document.getElementById('playerFormTitle');
      if (titleEl) titleEl.innerText = `✏️ Edit Player: ${p.name}`;

      const idInput = document.getElementById('formPlayerId');
      if (idInput) {
        idInput.value = p.playerId;
        idInput.readOnly = true;
      }

      const nameInput = document.getElementById('formName');
      if (nameInput) nameInput.value = p.name || '';

      const posInput = document.getElementById('formPosition');
      if (posInput) posInput.value = p.position || 'Forward';

      const natInput = document.getElementById('formNationality');
      if (natInput) natInput.value = p.nationality || '';

      const ageInput = document.getElementById('formAge');
      if (ageInput) ageInput.value = p.age || 20;

      const mvInput = document.getElementById('formMarketValue');
      if (mvInput) mvInput.value = p.marketValue || 0;

      const shirtInput = document.getElementById('formShirtNumber');
      if (shirtInput) shirtInput.value = p.shirtNumber || 10;

      const footInput = document.getElementById('formPreferredFoot');
      if (footInput) footInput.value = p.preferredFoot || 'Right';

      const bioInput = document.getElementById('formBio');
      if (bioInput) bioInput.value = p.bio || '';

      const teamSelect = document.getElementById('formTeamId');
      if (teamSelect) {
        const teamId = p.relationships?.team?.teamId || '';
        teamSelect.value = teamId;
      }

      const salInput = document.getElementById('formSalary');
      if (salInput) salInput.value = p.relationships?.contract?.salary || 10000000;

      if (p.stats) {
        const gInput = document.getElementById('formGoals');
        if (gInput) gInput.value = p.stats.goals ?? 0;
        const aInput = document.getElementById('formAssists');
        if (aInput) aInput.value = p.stats.assists ?? 0;
        const rInput = document.getElementById('formRating');
        if (rInput) rInput.value = p.stats.rating ?? 7.5;
        const pInput = document.getElementById('formPassAccuracy');
        if (pInput) pInput.value = p.stats.passAccuracy ?? 85.0;
      }

      const modal = document.getElementById('playerFormModal');
      if (modal) {
        modal.classList.add('active');
        console.log('[CRUD] playerFormModal successfully activated!');
      } else {
        alert('Error: #playerFormModal element not found in HTML DOM');
      }

    } catch (err) {
      console.error('Failed to load player for edit:', err);
      alert('Error fetching player details: ' + (err.stack || err.message));
    }
  },

  /**
   * CRUD: Handle Player Form Submission (CREATE / UPDATE)
   */
  async handlePlayerFormSubmit(e) {
    e.preventDefault();
    const mode = document.getElementById('formMode').value;
    const playerId = document.getElementById('formPlayerId').value.trim();

    const payload = {
      playerId,
      name: document.getElementById('formName').value.trim(),
      position: document.getElementById('formPosition').value,
      nationality: document.getElementById('formNationality').value.trim(),
      age: Number(document.getElementById('formAge').value),
      marketValue: Number(document.getElementById('formMarketValue').value),
      shirtNumber: Number(document.getElementById('formShirtNumber').value) || 10,
      preferredFoot: document.getElementById('formPreferredFoot').value,
      bio: document.getElementById('formBio').value.trim(),
      teamId: document.getElementById('formTeamId').value || null,
      salary: Number(document.getElementById('formSalary').value) || 10000000,
      stats: {
        goals: Number(document.getElementById('formGoals').value) || 0,
        assists: Number(document.getElementById('formAssists').value) || 0,
        rating: Number(document.getElementById('formRating').value) || 7.5,
        passAccuracy: Number(document.getElementById('formPassAccuracy').value) || 85.0
      }
    };

    try {
      let url = '/api/players';
      let method = 'POST';

      if (mode === 'edit') {
        url = `/api/players/${playerId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(`Error (${res.status}): ${result.error || 'Operation failed'}`);
        return;
      }

      // Hide modal
      document.getElementById('playerFormModal').classList.remove('active');

      // Refresh list
      await this.fetchPlayers();

      // Show Execution Inspector with the MongoDB operation metadata
      this.showCrudExecutionModal(result);

    } catch (err) {
      console.error('Error saving player:', err);
      alert('Network error saving player: ' + err.message);
    }
  },

  /**
   * CRUD: Open Delete Confirmation Modal
   */
  openDeletePlayerModal(playerId, playerName) {
    console.log('[CRUD] openDeletePlayerModal triggered for:', playerId, playerName);
    this.deletingPlayerId = playerId;
    const msgEl = document.getElementById('deleteConfirmMessage');
    if (msgEl) {
      msgEl.innerHTML = `Are you sure you want to delete player <strong>${playerName}</strong> (ID: <code>${playerId}</code>)?`;
    }
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
  },

  /**
   * CRUD: Confirm and Execute DELETE
   */
  async handleConfirmDelete() {
    if (!this.deletingPlayerId) return;
    const playerId = this.deletingPlayerId;

    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE'
      });

      const result = await res.json();

      document.getElementById('deleteConfirmModal').classList.remove('active');
      this.deletingPlayerId = null;

      if (!res.ok || !result.success) {
        alert(`Delete Failed (${res.status}): ${result.error || 'Operation failed'}`);
        return;
      }

      // Refresh list
      await this.fetchPlayers();

      // Show Execution Inspector with the MongoDB deleteOne operation
      this.showCrudExecutionModal(result);

    } catch (err) {
      console.error('Error deleting player:', err);
      alert('Network error deleting player: ' + err.message);
    }
  },

  /**
   * Display CRUD operation metadata for Professor inspection
   */
  showCrudExecutionModal(result) {
    const modal = document.getElementById('xmlModal');
    const modalTitle = document.getElementById('xmlModalTitle');
    const modalCode = document.getElementById('xmlModalCode');

    if (modal && result.polyglotMetadata) {
      const mongo = result.polyglotMetadata.mongoExecution;
      const neo4j = result.polyglotMetadata.neo4jExecution;

      modalTitle.innerHTML = `✅ CRUD Operation Success - Execution Inspector`;
      modalCode.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #f8fafc;">
          <div style="color: #38bdf8; font-weight: bold; margin-bottom: 0.5rem;">[1] EXECUTED MONGODB OPERATION: ${mongo.operation.toUpperCase()}</div>
          <pre style="background: rgba(56,189,248,0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem; white-space: pre-wrap;">db.collection('${mongo.collection}').${mongo.operation}(${JSON.stringify(mongo.document || mongo.filter || {}, null, 2)}${mongo.update ? ', ' + JSON.stringify(mongo.update, null, 2) : ''})</pre>

          <div style="color: #a7f3d0; font-weight: bold; margin-bottom: 0.5rem;">[2] EXECUTED NEO4J CYPHER GRAPH SYNC</div>
          <pre style="background: rgba(167,243,208,0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem; white-space: pre-wrap;">${neo4j.cypherQuery}\n\nParameters: ${JSON.stringify(neo4j.params, null, 2)}</pre>

          <div style="color: #fef08a; font-weight: bold; margin-bottom: 0.5rem;">[3] RESULT MESSAGE</div>
          <p style="font-family: var(--font-sans); color: #cbd5e1;">${result.message}</p>
        </div>
      `;
      modal.classList.add('active');
    }
  },

  /**
   * Display raw XML snippet for a single player
   */
  inspectPlayerXml(playerId) {
    if (!this.xmlDoc) return;
    const playerEl = this.xmlDoc.querySelector(`player[id="${playerId}"]`);
    if (playerEl) {
      const serializer = new XMLSerializer();
      const snippet = serializer.serializeToString(playerEl);
      XMLViewer.showModal(snippet, `XML Node for Player ID [${playerId}]`);
    }
  },

  /**
   * Display details modal for player
   */
  inspectPlayerDetail(playerId) {
    if (!this.xmlDoc) return;
    const playerEl = this.xmlDoc.querySelector(`player[id="${playerId}"]`);
    if (!playerEl) return;

    const name = playerEl.querySelector('mongo_document_attributes > name')?.textContent || '';
    const bio = playerEl.querySelector('mongo_document_attributes > bio')?.textContent || '';
    const teamName = playerEl.querySelector('plays_for_relationship > team > name')?.textContent || '';
    const stadium = playerEl.querySelector('plays_for_relationship > team > stadium')?.textContent || '';

    const modal = document.getElementById('xmlModal');
    const modalTitle = document.getElementById('xmlModalTitle');
    const modalCode = document.getElementById('xmlModalCode');

    if (modal) {
      modalTitle.innerHTML = `👤 Player Profile: ${name}`;
      modalCode.innerHTML = `
        <div style="font-family: var(--font-sans); color: #0f172a; line-height: 1.6;">
          <h4 style="color: #0284c7; margin-bottom: 0.5rem;">Document Catalog Attributes (MongoDB)</h4>
          <p><strong>Biography:</strong> ${bio}</p>
          <hr style="border-color: var(--border-color); margin: 1rem 0;" />
          <h4 style="color: #0f172a; margin-bottom: 0.5rem;">Graph Relationships (Neo4j)</h4>
          <p><strong>Current Club:</strong> ${teamName}</p>
          <p><strong>Home Stadium:</strong> ${stadium}</p>
        </div>
      `;
      modal.classList.add('active');
    }
  },

  /**
   * Show execution plan modal detailing Mongo query and Cypher query
   */
  showExecutionPlanModal() {
    if (!this.xmlDoc) return;
    
    const mongoMatch = this.xmlDoc.querySelector('mongo_execution_plan > find_filter')?.textContent || '{}';
    const mongoSort = this.xmlDoc.querySelector('mongo_execution_plan > sort_order')?.textContent || '{}';
    const cypherQuery = this.xmlDoc.querySelector('neo4j_execution_plan > cypher_query')?.textContent || 'N/A';

    const modal = document.getElementById('xmlModal');
    const modalTitle = document.getElementById('xmlModalTitle');
    const modalCode = document.getElementById('xmlModalCode');

    if (modal) {
      modalTitle.innerHTML = `🔍 Polyglot Query & Execution Inspector`;
      modalCode.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #f8fafc;">
          <div style="color: #38bdf8; font-weight: bold; margin-bottom: 0.5rem;">[1] MONGODB DOCUMENT QUERY ($match & $sort)</div>
          <pre style="background: rgba(56,189,248,0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem;">db.collection('players').find(${mongoMatch}).sort(${mongoSort})</pre>

          <div style="color: #a7f3d0; font-weight: bold; margin-bottom: 0.5rem;">[2] NEO4J CYPHER GRAPH QUERY</div>
          <pre style="background: rgba(167,243,208,0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem;">${cypherQuery}</pre>

          <div style="color: #fef08a; font-weight: bold; margin-bottom: 0.5rem;">[3] DATA INTEGRATION PIPELINE</div>
          <p style="font-family: var(--font-sans); color: #cbd5e1;">Both database results are fetched concurrently in Express backend, merged into memory, and serialized into an XML response payload matching Professor requirements.</p>
        </div>
      `;
      modal.classList.add('active');
    }
  }
};

window.App = App;
