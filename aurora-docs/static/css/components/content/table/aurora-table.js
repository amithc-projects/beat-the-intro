/* src/components/content/table/aurora-table.js */

export class AuroraTable {
  constructor(element, options = {}) {
    this.table = element;
    this.container = element.closest('.table-container');
    
    // Configuration
    this.apiUrl = options.apiUrl || null;
    this.columns = options.columns || []; // [{ key, label, type, render }]
    this.pageSize = options.pageSize || 10;
    this.currentPage = 1;
    this.totalItems = 0;
    
    // State
    this.data = []; // The raw data
    this.sortState = { key: null, direction: 'asc' };
    
    // UI References
    this.thead = this.table.querySelector('thead');
    this.tbody = this.table.querySelector('tbody');
    this.tfoot = this.table.querySelector('tfoot');
    
    // Initialize
    this.init();
  }

  init() {
    this.renderHeader();
    this.createPaginationControls();
    this.loadData();
  }

  // --- DATA LAYER ( The Adapter Strategy ) ---

  async loadData() {
    this.setLoading(true);
    
    try {
      if (this.apiUrl) {
        await this.fetchRemoteData();
      } else {
        // Handle local static data if needed
      }
      this.renderBody();
      this.updatePagination();
    } catch (err) {
      console.error("Table Error:", err);
      this.tbody.innerHTML = `<tr><td colspan="${this.columns.length}" class="text-center" style="color:var(--ds-sys-color-error)">Error loading data</td></tr>`;
    } finally {
      this.setLoading(false);
    }
  }

  async fetchRemoteData() {
    // 1. Calculate Pagination Params
    const skip = (this.currentPage - 1) * this.pageSize;
    const url = new URL(this.apiUrl);
    url.searchParams.set('limit', this.pageSize);
    url.searchParams.set('skip', skip);
    
    // 2. Fetch
    const response = await fetch(url);
    const json = await response.json();
    
    // 3. Normalize Response (Handle different API shapes if needed)
    this.data = json.products || json.data || [];
    this.totalItems = json.total || 0;
  }

  /**
   * THE TRANSFORMATION ENGINE
   * Extracts value from nested objects using dot notation (e.g. "meta.barcode")
   */
  getValue(row, key) {
    if (!key) return '';
    return key.split('.').reduce((o, i) => (o ? o[i] : null), row);
  }

  // --- PRESENTATION LAYER ---

  renderHeader() {
    const tr = document.createElement('tr');
    
    // 1. Selection Column
    const thSelect = document.createElement('th');
    thSelect.style.width = '40px';
    thSelect.innerHTML = `<input type="checkbox" aria-label="Select All">`;
    tr.appendChild(thSelect);

    // 2. Data Columns
    this.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.setAttribute('scope', 'col');
      
      // Sortable?
      if (col.sortable) {
        th.setAttribute('data-sort', col.type || 'string');
        th.style.cursor = 'pointer';
        // Add click listener for sort (omitted for brevity in this snippet)
      }
      
      // Alignment (Linking to your CSS Alignment Engine)
      if (col.align) {
        th.setAttribute('data-align', col.align);
      }

      tr.appendChild(th);
    });

    this.thead.innerHTML = '';
    this.thead.appendChild(tr);
  }

  renderBody() {
    this.tbody.innerHTML = '';

    if (this.data.length === 0) {
      this.tbody.innerHTML = `<tr><td colspan="${this.columns.length + 1}" class="text-center">No data found</td></tr>`;
      return;
    }

    this.data.forEach(row => {
      const tr = document.createElement('tr');

      // 1. Selection Cell
      const tdSelect = document.createElement('td');
      tdSelect.innerHTML = `<input type="checkbox" aria-label="Select Row">`;
      tr.appendChild(tdSelect);

      // 2. Data Cells
      this.columns.forEach(col => {
        const td = document.createElement('td');
        
        // A. Get Raw Value (Transformation)
        const rawValue = this.getValue(row, col.key);
        
        // B. Formatting / Rendering
        if (col.render) {
          // Custom Renderer (e.g., for Badges, Images)
          td.innerHTML = col.render(rawValue, row);
        } else {
          // Default Text
          td.textContent = rawValue;
        }
        
        // C. Specific Classes (e.g. text-right handled by CSS data-align, but we can add truncation)
        if (col.truncate) td.classList.add('cell-truncate');
        
        tr.appendChild(td);
      });

      this.tbody.appendChild(tr);
    });
  }

  // --- UI CONTROLS ---

  createPaginationControls() {
    // Basic footer controls
    if (!this.tfoot) {
      this.tfoot = document.createElement('tfoot');
      this.table.appendChild(this.tfoot);
    }
    
    // Use your Sticky Footer classes!
    this.table.classList.add('table--sticky-footer');

    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = this.columns.length + 1; // +1 for checkbox
    
    td.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-weight: normal;">
        <span id="page-info">Loading...</span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="secondary" id="btn-prev" disabled>Previous</button>
          <button class="secondary" id="btn-next" disabled>Next</button>
        </div>
      </div>
    `;
    
    tr.appendChild(td);
    this.tfoot.innerHTML = '';
    this.tfoot.appendChild(tr);

    // Bind Events
    this.tfoot.querySelector('#btn-prev').addEventListener('click', () => this.changePage(-1));
    this.tfoot.querySelector('#btn-next').addEventListener('click', () => this.changePage(1));
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    
    const info = this.tfoot.querySelector('#page-info');
    info.textContent = `Showing ${start}-${end} of ${this.totalItems}`;
    
    const prev = this.tfoot.querySelector('#btn-prev');
    const next = this.tfoot.querySelector('#btn-next');
    
    prev.disabled = this.currentPage === 1;
    next.disabled = end >= this.totalItems;
  }

  changePage(delta) {
    this.currentPage += delta;
    this.loadData();
  }

  setLoading(isLoading) {
    this.table.style.opacity = isLoading ? '0.5' : '1';
    this.table.style.pointerEvents = isLoading ? 'none' : 'auto';
  }
}