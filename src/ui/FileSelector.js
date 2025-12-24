/**
 * FileSelector - Mobile file selection modal
 * Allows users to choose which LIDAR files to load before downloading
 */

export class FileSelector {
  constructor({ files, onFilesSelected, onCancel }) {
    this.files = files;
    this.onFilesSelected = onFilesSelected;
    this.onCancel = onCancel;
    this.selectedFiles = [];
    this.modal = null;

    // Load last selection from localStorage
    this.loadLastSelection();
  }

  /**
   * Show the file selector modal
   * @returns {Promise} Resolves when user makes selection
   */
  show() {
    return new Promise((resolve, reject) => {
      this.createModal();
      this.onResolve = resolve;
      this.onReject = reject;
    });
  }

  /**
   * Create and display the modal
   */
  createModal() {
    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'file-selector-modal';

    // Create modal content structure
    const content = document.createElement('div');
    content.className = 'file-selector-content';

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Body with file groups
    const body = this.createBody();
    content.appendChild(body);

    // Footer with actions
    const footer = this.createFooter();
    content.appendChild(footer);

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    // Populate file lists
    this.populateFileList('featured-files', this.files.filter(f => f.category === 'featured'));
    this.populateFileList('tiles-files', this.files.filter(f => f.category === 'tiles'));

    // Setup event listeners
    this.setupEventListeners();

    // Restore last selection or select recommended
    if (this.lastSelection && this.lastSelection.length > 0) {
      this.restoreSelection(this.lastSelection);
    } else {
      const recommended = this.files.find(f => f.recommended);
      if (recommended) {
        this.toggleFileSelection(recommended.id, true);
      }
    }

    // Trigger animation
    setTimeout(() => {
      this.modal.classList.add('visible');
    }, 10);
  }

  /**
   * Create header section
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'file-selector-header';

    const title = document.createElement('h2');
    title.textContent = 'Choose Point Cloud Files';

    const subtitle = document.createElement('p');
    subtitle.className = 'file-selector-subtitle';
    subtitle.textContent = 'Select files to load. Larger files may take longer on mobile networks.';

    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  /**
   * Create body section
   */
  createBody() {
    const body = document.createElement('div');
    body.className = 'file-selector-body';

    // Featured files group
    const featuredGroup = document.createElement('div');
    featuredGroup.className = 'file-group';

    const featuredTitle = document.createElement('h3');
    featuredTitle.className = 'file-group-title';
    featuredTitle.textContent = '⭐ Recommended';

    const featuredList = document.createElement('div');
    featuredList.id = 'featured-files';
    featuredList.className = 'file-list';

    featuredGroup.appendChild(featuredTitle);
    featuredGroup.appendChild(featuredList);

    // Tiles group
    const tilesGroup = document.createElement('div');
    tilesGroup.className = 'file-group';

    const tilesHeader = document.createElement('h3');
    tilesHeader.className = 'file-group-title';
    tilesHeader.id = 'tiles-header';
    tilesHeader.textContent = '📁 Individual Tiles ';

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon';
    toggleIcon.textContent = '▼';
    tilesHeader.appendChild(toggleIcon);

    const tilesList = document.createElement('div');
    tilesList.id = 'tiles-files';
    tilesList.className = 'file-list collapsed';

    tilesGroup.appendChild(tilesHeader);
    tilesGroup.appendChild(tilesList);

    body.appendChild(featuredGroup);
    body.appendChild(tilesGroup);

    return body;
  }

  /**
   * Create footer section
   */
  createFooter() {
    const footer = document.createElement('div');
    footer.className = 'file-selector-footer';

    // Selection summary
    const summary = document.createElement('div');
    summary.className = 'selection-summary';

    const countSpan = document.createElement('span');
    countSpan.id = 'selection-count';
    countSpan.textContent = 'No files selected';

    const sizeSpan = document.createElement('span');
    sizeSpan.id = 'selection-size';
    sizeSpan.className = 'file-size-badge';

    summary.appendChild(countSpan);
    summary.appendChild(sizeSpan);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'file-selector-actions';

    const loadSelectedBtn = document.createElement('button');
    loadSelectedBtn.id = 'load-selected-btn';
    loadSelectedBtn.className = 'file-selector-btn primary';
    loadSelectedBtn.textContent = 'Load Selected';
    loadSelectedBtn.disabled = true;

    const loadAllBtn = document.createElement('button');
    loadAllBtn.id = 'load-all-btn';
    loadAllBtn.className = 'file-selector-btn secondary';
    loadAllBtn.textContent = 'Load All (775MB)';

    actions.appendChild(loadSelectedBtn);
    actions.appendChild(loadAllBtn);

    footer.appendChild(summary);
    footer.appendChild(actions);

    return footer;
  }

  /**
   * Populate a file list section
   */
  populateFileList(containerId, files) {
    const container = document.getElementById(containerId);

    files.forEach(file => {
      const fileItem = this.createFileItem(file);
      container.appendChild(fileItem);
    });
  }

  /**
   * Create a file item element
   */
  createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileId = file.id;

    const label = document.createElement('label');
    label.className = 'file-item-label';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'file-checkbox';
    checkbox.dataset.fileId = file.id;
    checkbox.dataset.fileSize = file.size.toString();

    // File info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-item-info';

    // File name and recommended badge
    const nameDiv = document.createElement('div');
    nameDiv.className = 'file-item-name';
    nameDiv.textContent = file.name;

    if (file.recommended) {
      const badge = document.createElement('span');
      badge.className = 'recommended-badge';
      badge.textContent = 'Recommended';
      nameDiv.appendChild(document.createTextNode(' '));
      nameDiv.appendChild(badge);
    }

    // File details (size + description)
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'file-item-details';

    const sizeBadge = document.createElement('span');
    const sizeClass = file.size < 50 ? 'good' : file.size < 100 ? 'warning' : 'danger';
    sizeBadge.className = `file-size-badge ${sizeClass}`;
    sizeBadge.textContent = `${file.size}MB`;

    detailsDiv.appendChild(sizeBadge);

    if (file.description) {
      const desc = document.createElement('span');
      desc.className = 'file-description';
      desc.textContent = file.description;
      detailsDiv.appendChild(desc);
    }

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(detailsDiv);

    label.appendChild(checkbox);
    label.appendChild(infoDiv);
    fileItem.appendChild(label);

    return fileItem;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Checkbox changes
    this.modal.querySelectorAll('.file-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.toggleFileSelection(e.target.dataset.fileId, e.target.checked);
      });
    });

    // Load selected button
    const loadSelectedBtn = document.getElementById('load-selected-btn');
    loadSelectedBtn.addEventListener('click', () => {
      this.handleLoadSelected();
    });

    // Load all button
    const loadAllBtn = document.getElementById('load-all-btn');
    loadAllBtn.addEventListener('click', () => {
      this.handleLoadAll();
    });

    // Tiles section toggle
    const tilesHeader = document.getElementById('tiles-header');
    const tilesFiles = document.getElementById('tiles-files');
    tilesHeader.addEventListener('click', () => {
      tilesFiles.classList.toggle('collapsed');
      const icon = tilesHeader.querySelector('.toggle-icon');
      icon.textContent = tilesFiles.classList.contains('collapsed') ? '▼' : '▲';
    });
  }

  /**
   * Toggle file selection
   */
  toggleFileSelection(fileId, selected) {
    if (selected) {
      const file = this.files.find(f => f.id === fileId);
      if (file && !this.selectedFiles.find(f => f.id === fileId)) {
        this.selectedFiles.push(file);
      }
    } else {
      this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
    }

    this.updateSelectionSummary();
  }

  /**
   * Update selection summary display
   */
  updateSelectionSummary() {
    const countEl = document.getElementById('selection-count');
    const sizeEl = document.getElementById('selection-size');
    const loadSelectedBtn = document.getElementById('load-selected-btn');

    const count = this.selectedFiles.length;
    const totalSize = this.selectedFiles.reduce((sum, f) => sum + f.size, 0);

    if (count === 0) {
      countEl.textContent = 'No files selected';
      sizeEl.textContent = '';
      loadSelectedBtn.disabled = true;
    } else {
      countEl.textContent = `${count} file${count > 1 ? 's' : ''} selected`;

      const sizeClass = totalSize < 100 ? 'good' : totalSize < 200 ? 'warning' : 'danger';

      // Clear and rebuild size badge
      sizeEl.textContent = '';
      const sizeSpan = document.createElement('span');
      sizeSpan.className = sizeClass;
      sizeSpan.textContent = `${totalSize}MB`;
      sizeEl.appendChild(sizeSpan);

      loadSelectedBtn.textContent = `Load Selected (${totalSize}MB)`;
      loadSelectedBtn.disabled = false;
    }
  }

  /**
   * Handle load selected button click
   */
  handleLoadSelected() {
    if (this.selectedFiles.length === 0) return;

    // Save selection to localStorage
    this.saveSelection(this.selectedFiles.map(f => f.id));

    // Close modal
    this.close();

    // Call callback
    if (this.onFilesSelected) {
      this.onFilesSelected(this.selectedFiles);
    }

    // Resolve promise
    if (this.onResolve) {
      this.onResolve(this.selectedFiles);
    }
  }

  /**
   * Handle load all button click
   */
  handleLoadAll() {
    const confirmed = confirm(
      'Loading all files (775MB) may take several minutes and consume significant data. ' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    // Save selection
    this.saveSelection(this.files.map(f => f.id));

    // Close modal
    this.close();

    // Call callback with all files
    if (this.onFilesSelected) {
      this.onFilesSelected(this.files);
    }

    // Resolve promise
    if (this.onResolve) {
      this.onResolve(this.files);
    }
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.classList.remove('visible');
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
    }, 300);
  }

  /**
   * Save selection to localStorage
   */
  saveSelection(fileIds) {
    try {
      localStorage.setItem('lidar-file-selection', JSON.stringify(fileIds));
    } catch (e) {
      console.warn('Could not save file selection:', e);
    }
  }

  /**
   * Load last selection from localStorage
   */
  loadLastSelection() {
    try {
      const saved = localStorage.getItem('lidar-file-selection');
      this.lastSelection = saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Could not load file selection:', e);
      this.lastSelection = null;
    }
  }

  /**
   * Restore previous selection
   */
  restoreSelection(fileIds) {
    fileIds.forEach(fileId => {
      const checkbox = this.modal.querySelector(`.file-checkbox[data-file-id="${fileId}"]`);
      if (checkbox) {
        checkbox.checked = true;
        this.toggleFileSelection(fileId, true);
      }
    });
  }
}
