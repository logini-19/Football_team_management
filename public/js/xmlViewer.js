/**
 * XML Syntax Highlighter & Inspector Tool
 * Formats XML strings with indentation and colors tags, attributes, and text nodes.
 */

window.XMLViewer = {
  /**
   * Format and highlight XML text
   * @param {string} xmlString 
   * @returns {string} Formatted HTML representation
   */
  formatAndHighlight(xmlString) {
    if (!xmlString) return '';

    // Clean up whitespace
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    xmlString = xmlString.replace(reg, '$1\r\n$2$3');
    let pad = 0;

    const lines = xmlString.split('\r\n');
    lines.forEach(line => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      let padding = '';
      for (let i = 0; i < pad; i++) {
        padding += '  ';
      }

      formatted += padding + line + '\n';
      pad += indent;
    });

    // Escape HTML special characters
    const escaped = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply CSS syntax highlighting classes
    return escaped
      // Highlight XML Comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6b7280;font-style:italic;">$1</span>')
      // Highlight Tags (<tag> or </tag>)
      .replace(/(&lt;\/?[a-zA-Z0-9_-]+)/g, '<span class="xml-tag">$1</span>')
      // Highlight Attributes (attr="val")
      .replace(/([a-zA-Z0-9_-]+)=&quot;(.*?)&quot;/g, '<span class="xml-attr">$1</span>=<span class="xml-val">&quot;$2&quot;</span>')
      // Highlight Tag Closures (>)
      .replace(/(&gt;)/g, '<span class="xml-tag">$1</span>');
  },

  /**
   * Open Modal with raw XML content
   * @param {string} xmlText 
   * @param {string} title 
   */
  showModal(xmlText, title = 'XML Payload Inspection') {
    const modal = document.getElementById('xmlModal');
    const modalTitle = document.getElementById('xmlModalTitle');
    const modalCode = document.getElementById('xmlModalCode');

    if (!modal || !modalCode) return;

    modalTitle.innerHTML = `📄 ${title}`;
    modalCode.innerHTML = this.formatAndHighlight(xmlText);
    modal.classList.add('active');

    // Store raw text for copy button
    window._lastXmlText = xmlText;
  },

  /**
   * Copy XML to clipboard
   */
  copyToClipboard() {
    if (!window._lastXmlText) return;
    navigator.clipboard.writeText(window._lastXmlText).then(() => {
      alert('XML Payload successfully copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy XML:', err);
    });
  }
};
