/**
 * Graph Relationship Visualizer (Clean Minimal Light Theme)
 * Renders Neo4j Nodes and Edges on HTML5 Canvas.
 */

window.GraphVisualizer = {
  canvas: null,
  ctx: null,
  nodes: [],
  links: [],
  selectedNode: null,
  detailsEl: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.detailsEl = document.getElementById('graphNodeDetails');
    if (!this.canvas.dataset.graphBound) {
      this.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
      this.canvas.dataset.graphBound = 'true';
    }
  },

  handleCanvasClick(event) {
    if (!this.canvas || !this.nodes.length) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    let clickedNode = null;
    for (const node of this.nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = node.type === 'Team' ? 18 : 16;
      if (distance <= radius + 6) {
        clickedNode = node;
        break;
      }
    }

    if (!clickedNode) {
      this.selectedNode = null;
      this.hideDetails();
      return;
    }

    this.selectedNode = clickedNode;
    this.showNodeDetails(clickedNode);
  },

  hideDetails() {
    if (this.detailsEl) {
      this.detailsEl.style.display = 'none';
      this.detailsEl.querySelector('#graphNodeDetailsContent').innerHTML = '';
    }
  },

  showNodeDetails(node) {
    if (!this.detailsEl) return;

    const connected = this.links.filter(link =>
      (link.sourceNode && link.sourceNode.id === node.id) ||
      (link.targetNode && link.targetNode.id === node.id)
    );

    const detailItems = connected.map(link => {
      const other = link.sourceNode && link.sourceNode.id === node.id ? link.targetNode : link.sourceNode;
      return `<div style="margin-top: 0.4rem; font-size: 0.8rem;"><strong style="color:#0f172a;">${link.label}</strong> → ${other ? other.label : 'Related Node'}</div>`;
    }).join('') || '<div style="font-size: 0.8rem; color: var(--text-muted);">No direct relationships found for this node.</div>';

    const content = `
      <div style="display:flex; flex-wrap:wrap; gap:0.7rem; align-items:center; margin-bottom:0.5rem;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${node.type === 'Player' ? '#0284c7' : node.type === 'Team' ? '#0f172a' : '#64748b'};"></span>
        <strong style="font-size:1rem;">${this.truncateLabel(node.label, 28)}</strong>
        <span style="padding:0.2rem 0.5rem; border-radius:999px; background:#e2e8f0; color:#334155; font-size:0.7rem; font-weight:700;">${node.type}</span>
      </div>
      <div style="font-size:0.8rem; color: var(--text-muted); margin-bottom:0.5rem;">${node.subtitle || 'No subtitle available'}</div>
      <div style="font-size:0.8rem; color: var(--text-muted);"><strong>Connected Relationships</strong></div>
      ${detailItems}
    `;

    const contentEl = this.detailsEl.querySelector('#graphNodeDetailsContent');
    if (contentEl) {
      this.detailsEl.style.display = 'block';
      contentEl.innerHTML = content;
    }
  },

  truncateLabel(text, maxLen = 14) {
    if (!text) return '';
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
  },

  getNodeLabelStyle(node) {
    if (this.nodes.length <= 8) return { showSubtitle: true, maxLabel: 12, maxSubtitle: 18 };
    return { showSubtitle: false, maxLabel: 10, maxSubtitle: 0 };
  },

  renderGraph(nodesData, linksData) {
    if (!this.canvas) this.init('graphCanvas');
    if (!this.ctx) return;

    const width = this.canvas.width = this.canvas.offsetWidth || 820;
    const height = this.canvas.height = 460;

    if (!nodesData.length) {
      this.nodes = [];
      this.links = [];
      this.drawEmptyState(width, height);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const total = nodesData.length;
    const baseRadius = Math.min(width, height) * (total <= 5 ? 0.28 : total <= 8 ? 0.34 : total <= 12 ? 0.40 : 0.46);

    this.nodes = nodesData.map((node, idx) => {
      const angle = (idx / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
      const radius = baseRadius + (idx % 3) * 18;

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    const nodeMap = new Map();
    this.nodes.forEach(n => nodeMap.set(n.id, n));

    this.links = linksData.map((l, idx) => ({
      ...l,
      sourceNode: nodeMap.get(l.source),
      targetNode: nodeMap.get(l.target),
      offset: idx % 2 === 0 ? 12 : -12
    })).filter(l => l.sourceNode && l.targetNode);

    this.draw();
  },

  drawEmptyState(width, height) {
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = '#475569';
    this.ctx.font = '600 18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('No matching Neo4j graph data for the current filters', width / 2, height / 2);
  },

  draw() {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, width, height);

    if (this.nodes.length <= 8) {
      this.links.forEach((link, idx) => {
        const { sourceNode, targetNode, label, offset } = link;
        this.ctx.beginPath();
        this.ctx.moveTo(sourceNode.x, sourceNode.y);
        this.ctx.lineTo(targetNode.x, targetNode.y);

        if (label === 'RIVAL_OF') {
          this.ctx.strokeStyle = '#94a3b8';
          this.ctx.lineWidth = 1.2;
          this.ctx.setLineDash([6, 6]);
        } else {
          this.ctx.strokeStyle = '#60a5fa';
          this.ctx.lineWidth = 1.8;
          this.ctx.setLineDash([]);
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);
        const midX = (sourceNode.x + targetNode.x) / 2 + Math.cos(angle + Math.PI / 2) * offset;
        const midY = (sourceNode.y + targetNode.y) / 2 + Math.sin(angle + Math.PI / 2) * offset;

        this.ctx.fillStyle = '#475569';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, midX, midY - 3 + (idx % 2 === 0 ? 0 : 10));
      });
    } else {
      this.links.forEach(link => {
        const { sourceNode, targetNode, label } = link;
        this.ctx.beginPath();
        this.ctx.moveTo(sourceNode.x, sourceNode.y);
        this.ctx.lineTo(targetNode.x, targetNode.y);
        this.ctx.strokeStyle = label === 'RIVAL_OF' ? '#94a3b8' : '#60a5fa';
        this.ctx.lineWidth = label === 'RIVAL_OF' ? 1.1 : 1.6;
        this.ctx.setLineDash(label === 'RIVAL_OF' ? [6, 6] : [0, 0]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      });
    }

    this.nodes.forEach(node => {
      this.ctx.beginPath();
      let color = '#0284c7';
      let r = 16;

      if (node.type === 'Player') {
        color = '#0284c7';
        r = 16;
      } else if (node.type === 'Team') {
        color = '#0f172a';
        r = 18;
      } else if (node.type === 'Manager') {
        color = '#64748b';
        r = 15;
      }

      this.ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      const style = this.getNodeLabelStyle(node);
      const label = this.truncateLabel(node.label, style.maxLabel);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = '600 10px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(label, node.x, node.y + r + 14);

      if (style.showSubtitle && node.subtitle) {
        const subtitle = this.truncateLabel(node.subtitle, style.maxSubtitle);
        this.ctx.fillStyle = '#475569';
        this.ctx.font = '8px sans-serif';
        this.ctx.fillText(subtitle, node.x, node.y + r + 25);
      }
    });
  },

  async showModal() {
    const modal = document.getElementById('graphModal');
    if (modal) modal.classList.add('active');

    this.selectedNode = null;
    this.hideDetails();

    try {
      const appRef = globalThis.App || window.App;
      const queryString = appRef && typeof appRef.getFilterQueryParams === 'function'
        ? appRef.getFilterQueryParams()
        : '';

      const res = await fetch(`/api/graph${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();
      this.renderGraph(data.nodes || [], data.links || []);
    } catch (err) {
      console.error('Failed to load graph data:', err);
      this.drawEmptyState(this.canvas?.width || 820, this.canvas?.height || 460);
    }
  }
};
