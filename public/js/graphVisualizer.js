/**
 * Graph Relationship Visualizer (Clean Minimal Light Theme)
 * Renders Neo4j Nodes and Edges on HTML5 Canvas.
 */

window.GraphVisualizer = {
  canvas: null,
  ctx: null,
  nodes: [],
  links: [],

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
  },

  renderGraph(nodesData, linksData) {
    if (!this.canvas) this.init('graphCanvas');
    if (!this.ctx) return;

    const width = this.canvas.width = this.canvas.offsetWidth || 800;
    const height = this.canvas.height = 460;

    // Arrange nodes in circular layout
    const radius = Math.min(width, height) * 0.35;
    const centerX = width / 2;
    const centerY = height / 2;

    this.nodes = nodesData.map((node, idx) => {
      const angle = (idx / nodesData.length) * 2 * Math.PI;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40
      };
    });

    const nodeMap = new Map();
    this.nodes.forEach(n => nodeMap.set(n.id, n));

    this.links = linksData.map(l => ({
      ...l,
      sourceNode: nodeMap.get(l.source),
      targetNode: nodeMap.get(l.target)
    })).filter(l => l.sourceNode && l.targetNode);

    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    // Draw Links / Edges (Subtle lines)
    this.links.forEach(link => {
      const { sourceNode, targetNode, label } = link;
      this.ctx.beginPath();
      this.ctx.moveTo(sourceNode.x, sourceNode.y);
      this.ctx.lineTo(targetNode.x, targetNode.y);

      if (label === 'RIVAL_OF') {
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
      } else {
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([]);
      }

      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset dash

      // Draw Edge Label
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '9px monospace';
      this.ctx.fillText(label, midX, midY);
    });

    // Draw Nodes (Minimal solid circles)
    this.nodes.forEach(node => {
      this.ctx.beginPath();
      let color = '#0284c7';
      let r = 16;

      if (node.type === 'Player') {
        color = '#0284c7'; // Sky Blue Accent
        r = 15;
      } else if (node.type === 'Team') {
        color = '#0f172a'; // Deep Dark Slate
        r = 20;
      } else if (node.type === 'Manager') {
        color = '#64748b'; // Slate Gray
        r = 15;
      }

      this.ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Node Label
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = '600 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, node.x, node.y + r + 14);

      if (node.subtitle) {
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '9px sans-serif';
        this.ctx.fillText(node.subtitle, node.x, node.y + r + 25);
      }
    });
  },

  async showModal() {
    const modal = document.getElementById('graphModal');
    if (modal) modal.classList.add('active');

    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      this.renderGraph(data.nodes || [], data.links || []);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    }
  }
};
