/**
 * StudyTube Hub - Core JavaScript Logic
 * Persistent Subject-wise YouTube bookmark manager
 */

// Storage Key
const STORAGE_KEY = 'studytube_hub_data_v1';

// Initial Demo Seed Data
const DEFAULT_DATA = {
  subjects: [
    {
      id: 'sub_1',
      name: 'Calculus & Linear Algebra',
      description: 'Foundations of Higher Mathematics',
      color: '#6366f1',
      createdAt: Date.now() - 3600000 * 24,
      links: [
        {
          id: 'lnk_1',
          title: 'Essence of Calculus, Chapter 1',
          url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
          notes: '3Blue1Brown - Visual intuition for limits & derivatives',
          videoId: 'WUvTyaaNkzM',
          createdAt: Date.now() - 3600000 * 24
        },
        {
          id: 'lnk_2',
          title: 'Essence of Linear Algebra, Vectors',
          url: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
          notes: 'Chapter 1: Vectors, what even are they?',
          videoId: 'fNk_zzaMoSs',
          createdAt: Date.now() - 3600000 * 20
        }
      ]
    },
    {
      id: 'sub_2',
      name: 'Computer Science & Algorithms',
      description: 'Data Structures, Algorithms & System Design',
      color: '#06b6d4',
      createdAt: Date.now() - 3600000 * 18,
      links: [
        {
          id: 'lnk_3',
          title: 'Harvard CS50 - Full Computer Science Course',
          url: 'https://www.youtube.com/watch?v=8mAITcNt710',
          notes: 'David J. Malan introductory lecture',
          videoId: '8mAITcNt710',
          createdAt: Date.now() - 3600000 * 18
        },
        {
          id: 'lnk_4',
          title: 'Graph Algorithms for Technical Interviews',
          url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
          notes: 'FreeCodeCamp graph traversal essentials',
          videoId: 'tWVWeAqZ0WU',
          createdAt: Date.now() - 3600000 * 10
        }
      ]
    },
    {
      id: 'sub_3',
      name: 'Physics & Astronomy',
      description: 'Quantum Mechanics, Relativity & Space',
      color: '#ec4899',
      createdAt: Date.now() - 3600000 * 8,
      links: [
        {
          id: 'lnk_5',
          title: 'Map of Physics by Domain of Science',
          url: 'https://www.youtube.com/watch?v=ZihywtixUYo',
          notes: 'Complete overview of classical & modern physics',
          videoId: 'ZihywtixUYo',
          createdAt: Date.now() - 3600000 * 8
        }
      ]
    }
  ]
};

// Application State
let appData = {
  subjects: []
};

let currentFilter = 'all';
let searchQuery = '';

/* ===================================================
   YouTube URL Utilities
   =================================================== */

/**
 * Extract YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://music.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const cleanedUrl = url.trim();

  // Pattern covering standard watch?v=, embed, shorts, youtu.be
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = cleanedUrl.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

/**
 * Generate Thumbnail URL for video ID
 */
function getYouTubeThumbnail(videoId) {
  if (!videoId) {
    return null;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/* ===================================================
   Data Persistence (LocalStorage)
   =================================================== */

function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.subjects)) {
        appData = parsed;
        return;
      }
    }
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
  }

  // Load default seed data on first run
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveAppData();
}

function saveAppData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
    showToast('Failed to save to browser storage!', 'error');
  }
}

/* ===================================================
   DOM Elements & Initialization
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadAppData();
  initUIEventListeners();
  renderApp();
});

function initUIEventListeners() {
  // Global search input
  const searchInput = document.getElementById('global-search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderApp();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderApp();
  });

  // Top Quick Add Form
  const quickAddForm = document.getElementById('quick-add-form');
  quickAddForm.addEventListener('submit', handleQuickAddLink);

  // Top New Subject Button
  const btnNewSubject = document.getElementById('btn-open-new-subject');
  btnNewSubject.addEventListener('click', () => openSubjectModal());

  // Subject Modal Form Submit
  const subjectForm = document.getElementById('subject-form');
  subjectForm.addEventListener('submit', handleSubjectFormSubmit);

  // Link Modal Form Submit
  const linkForm = document.getElementById('link-form');
  linkForm.addEventListener('submit', handleLinkFormSubmit);

  // Live URL preview in Link Modal
  const linkUrlInput = document.getElementById('link-url-input');
  linkUrlInput.addEventListener('input', handleLinkUrlPreview);

  // Backup Modal Trigger
  const btnBackup = document.getElementById('btn-open-backup');
  btnBackup.addEventListener('click', () => openModal('backup-modal'));

  // Export JSON
  const btnExport = document.getElementById('btn-export-json');
  btnExport.addEventListener('click', handleExportJSON);

  // Import JSON
  const btnTriggerImport = document.getElementById('btn-trigger-import');
  const importFileInput = document.getElementById('import-file-input');
  btnTriggerImport.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportJSON);

  // Reset to Demo
  const btnResetDemo = document.getElementById('btn-reset-demo');
  btnResetDemo.addEventListener('click', handleResetDemo);

  // Close modals on clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // ESC key to close any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        closeModal(modal.id);
      });
      closePlayerModal();
    }
  });
}

/* ===================================================
   Rendering Core
   =================================================== */

function renderApp() {
  updateStats();
  updateQuickSubjectSelect();
  renderFilterChips();
  renderSubjectCards();
}

/**
 * Update Header Stats
 */
function updateStats() {
  const subjectCountEl = document.getElementById('subject-count');
  const linkCountEl = document.getElementById('link-count');

  const totalSubjects = appData.subjects.length;
  let totalLinks = 0;
  appData.subjects.forEach(sub => {
    totalLinks += (sub.links || []).length;
  });

  subjectCountEl.textContent = totalSubjects;
  linkCountEl.textContent = totalLinks;
}

/**
 * Populate Subject dropdown in the Quick-Add bar
 */
function updateQuickSubjectSelect() {
  const select = document.getElementById('quick-subject-select');
  const currentVal = select.value;

  select.innerHTML = '<option value="" disabled selected>Select Subject...</option>';

  appData.subjects.forEach(subj => {
    const opt = document.createElement('option');
    opt.value = subj.id;
    opt.textContent = subj.name;
    select.appendChild(opt);
  });

  if (currentVal && appData.subjects.some(s => s.id === currentVal)) {
    select.value = currentVal;
  }
}

/**
 * Render filter pills (All Subjects + each subject tag)
 */
function renderFilterChips() {
  const container = document.getElementById('subject-chips-container');
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `chip-item ${currentFilter === 'all' ? 'active' : ''}`;
  allBtn.textContent = 'All Subjects';
  allBtn.addEventListener('click', () => {
    currentFilter = 'all';
    renderApp();
  });
  container.appendChild(allBtn);

  appData.subjects.forEach(subj => {
    const chip = document.createElement('button');
    chip.className = `chip-item ${currentFilter === subj.id ? 'active' : ''}`;
    chip.innerHTML = `
      <span class="chip-dot" style="color: ${subj.color || '#6366f1'};"></span>
      <span>${escapeHtml(subj.name)} (${(subj.links || []).length})</span>
    `;
    chip.addEventListener('click', () => {
      currentFilter = subj.id;
      renderApp();
    });
    container.appendChild(chip);
  });
}

/**
 * Render Subject Cards and their YouTube Link items
 */
function renderSubjectCards() {
  const container = document.getElementById('subjects-container');
  const emptyState = document.getElementById('empty-state');

  container.innerHTML = '';

  if (appData.subjects.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  // Filter subjects based on active chip filter and search query
  const filteredSubjects = appData.subjects.filter(subj => {
    if (currentFilter !== 'all' && subj.id !== currentFilter) {
      return false;
    }

    if (!searchQuery) return true;

    // Search subject name and description
    const nameMatch = subj.name.toLowerCase().includes(searchQuery);
    const descMatch = (subj.description || '').toLowerCase().includes(searchQuery);

    // Search inside links
    const linkMatch = (subj.links || []).some(lnk => 
      lnk.title.toLowerCase().includes(searchQuery) ||
      (lnk.notes || '').toLowerCase().includes(searchQuery) ||
      lnk.url.toLowerCase().includes(searchQuery)
    );

    return nameMatch || descMatch || linkMatch;
  });

  if (filteredSubjects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No matching subjects or videos found.</p>
        <small>Try clearing your search query or selecting "All Subjects".</small>
      </div>
    `;
    return;
  }

  filteredSubjects.forEach(subj => {
    const card = createSubjectCardElement(subj);
    container.appendChild(card);
  });
}

/**
 * Build Single Subject Card DOM
 */
function createSubjectCardElement(subj) {
  const card = document.createElement('div');
  card.className = 'subject-card';
  card.dataset.id = subj.id;

  const accentColor = subj.color || '#6366f1';

  // Filter links inside subject if search query is active
  let displayLinks = subj.links || [];
  if (searchQuery) {
    displayLinks = displayLinks.filter(lnk => 
      lnk.title.toLowerCase().includes(searchQuery) ||
      (lnk.notes || '').toLowerCase().includes(searchQuery) ||
      lnk.url.toLowerCase().includes(searchQuery) ||
      subj.name.toLowerCase().includes(searchQuery)
    );
  }

  card.innerHTML = `
    <div class="card-accent-bar" style="background: linear-gradient(90deg, ${accentColor}, transparent);"></div>
    <div class="card-header">
      <div class="subject-title-area">
        <div class="subject-badge-row">
          <span class="subject-color-badge" style="background-color: ${accentColor}; box-shadow: 0 0 10px ${accentColor};"></span>
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: ${accentColor};">Subject</span>
        </div>
        <h2 class="subject-name">${escapeHtml(subj.name)}</h2>
        ${subj.description ? `<p class="subject-description">${escapeHtml(subj.description)}</p>` : ''}
      </div>
      <div class="subject-actions">
        <button class="icon-action-btn" title="Edit Subject details" onclick="openSubjectModal('${subj.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-action-btn delete-btn" title="Delete Subject" onclick="deleteSubject('${subj.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- YouTube Links Container -->
    <div class="links-container" id="links-container-${subj.id}">
      <!-- Links rendered below -->
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <button class="btn-add-subject-link" onclick="openLinkModal('${subj.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add YouTube Link to ${escapeHtml(subj.name)}</span>
      </button>
    </div>
  `;

  // Render link items inside card
  const linksBox = card.querySelector(`#links-container-${subj.id}`);
  if (displayLinks.length === 0) {
    linksBox.innerHTML = `
      <div class="links-empty-placeholder">
        <span>No YouTube links saved yet.</span>
      </div>
    `;
  } else {
    displayLinks.forEach(link => {
      const linkEl = createLinkItemElement(subj.id, link);
      linksBox.appendChild(linkEl);
    });
  }

  return card;
}

/**
 * Build Single YouTube Link Item Element
 */
function createLinkItemElement(subjectId, link) {
  const item = document.createElement('div');
  item.className = 'link-item';
  item.dataset.id = link.id;

  const videoId = link.videoId || extractYouTubeVideoId(link.url);
  const thumbUrl = getYouTubeThumbnail(videoId);

  const thumbHtml = thumbUrl ? `
    <div class="link-thumbnail-box" title="Click to watch preview" onclick="openPlayerModal('${escapeAttr(link.title)}', '${videoId}', '${escapeAttr(link.url)}', '${escapeAttr(link.notes || '')}')">
      <img src="${thumbUrl}" alt="Thumbnail for ${escapeAttr(link.title)}" loading="lazy" onerror="this.src='https://placehold.co/120x80/1a1a24/ef4444?text=YouTube';">
      <div class="play-overlay-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6 3 20 12 6 21 6 3"></polygon>
        </svg>
      </div>
    </div>
  ` : `
    <div class="link-thumbnail-box" onclick="window.open('${escapeAttr(link.url)}', '_blank', 'noopener,noreferrer')">
      <div class="play-overlay-icon" style="background: rgba(239, 68, 68, 0.2);">
        <svg viewBox="0 0 24 24" fill="currentColor" style="color: #ef4444;">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
        </svg>
      </div>
    </div>
  `;

  item.innerHTML = `
    ${thumbHtml}
    <div class="link-details">
      <!-- Clicking the title or watch button redirects to YouTube in a new tab -->
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="link-title" title="Open in YouTube">
        ${escapeHtml(link.title)}
      </a>
      <div class="link-meta-row">
        <span class="link-url-tag" title="${escapeAttr(link.url)}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          ${formatDomain(link.url)}
        </span>
        ${link.notes ? `<span class="link-note-tag" title="${escapeAttr(link.notes)}">${escapeHtml(link.notes)}</span>` : ''}
      </div>
    </div>
    
    <div class="link-item-actions">
      <!-- Direct Redirection Button to YouTube -->
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="btn-open-youtube" title="Redirect to YouTube">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6 3 20 12 6 21 6 3"></polygon>
        </svg>
        <span>Watch</span>
      </a>

      <!-- Edit Link -->
      <button class="icon-action-btn" title="Edit Link" onclick="openLinkModal('${subjectId}', '${link.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      <!-- Delete Link -->
      <button class="icon-action-btn delete-btn" title="Remove Link" onclick="deleteLink('${subjectId}', '${link.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  return item;
}

/* ===================================================
   Subject Management Actions
   =================================================== */

/**
 * Open Modal to Create or Edit a Subject
 */
window.openSubjectModal = function(subjectId = null) {
  const modal = document.getElementById('subject-modal');
  const modalTitle = document.getElementById('subject-modal-title');
  const editIdInput = document.getElementById('edit-subject-id');
  const nameInput = document.getElementById('subject-name-input');
  const descInput = document.getElementById('subject-desc-input');

  if (subjectId) {
    const subj = appData.subjects.find(s => s.id === subjectId);
    if (!subj) return;
    modalTitle.textContent = 'Edit Subject';
    editIdInput.value = subj.id;
    nameInput.value = subj.name;
    descInput.value = subj.description || '';

    // Set selected color radio
    const colorRadio = document.querySelector(`input[name="subject-color"][value="${subj.color}"]`);
    if (colorRadio) colorRadio.checked = true;
  } else {
    modalTitle.textContent = 'Create New Subject';
    editIdInput.value = '';
    nameInput.value = '';
    descInput.value = '';
    const defaultRadio = document.querySelector('input[name="subject-color"][value="#6366f1"]');
    if (defaultRadio) defaultRadio.checked = true;
  }

  openModal('subject-modal');
  setTimeout(() => nameInput.focus(), 100);
};

/**
 * Handle Subject Form Submission
 */
function handleSubjectFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-subject-id').value;
  const nameInput = document.getElementById('subject-name-input');
  const descInput = document.getElementById('subject-desc-input');
  const selectedColorInput = document.querySelector('input[name="subject-color"]:checked');

  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  const color = selectedColorInput ? selectedColorInput.value : '#6366f1';

  if (!name) {
    showToast('Please enter a subject name', 'error');
    return;
  }

  if (editId) {
    // Edit existing subject
    const subj = appData.subjects.find(s => s.id === editId);
    if (subj) {
      subj.name = name;
      subj.description = description;
      subj.color = color;
      saveAppData();
      showToast(`Subject "${name}" updated!`, 'success');
    }
  } else {
    // Create new subject
    const newSubj = {
      id: 'sub_' + Date.now(),
      name,
      description,
      color,
      createdAt: Date.now(),
      links: []
    };
    appData.subjects.unshift(newSubj);
    saveAppData();
    showToast(`Subject "${name}" added successfully!`, 'success');
  }

  closeModal('subject-modal');
  renderApp();
}

/**
 * Delete Subject
 */
window.deleteSubject = function(subjectId) {
  const subj = appData.subjects.find(s => s.id === subjectId);
  if (!subj) return;

  const count = (subj.links || []).length;
  const confirmMsg = count > 0 
    ? `Delete "${subj.name}" and its ${count} YouTube video links?` 
    : `Delete subject "${subj.name}"?`;

  if (confirm(confirmMsg)) {
    appData.subjects = appData.subjects.filter(s => s.id !== subjectId);
    if (currentFilter === subjectId) {
      currentFilter = 'all';
    }
    saveAppData();
    showToast(`Subject "${subj.name}" removed`, 'info');
    renderApp();
  }
};

/* ===================================================
   Link Management Actions
   =================================================== */

/**
 * Open Modal to Add or Edit Link in a Subject
 */
window.openLinkModal = function(subjectId, linkId = null) {
  const targetSubjInput = document.getElementById('target-subject-id');
  const editLinkIdInput = document.getElementById('edit-link-id');
  const titleInput = document.getElementById('link-title-input');
  const urlInput = document.getElementById('link-url-input');
  const notesInput = document.getElementById('link-notes-input');
  const modalTitle = document.getElementById('link-modal-title');
  const previewBox = document.getElementById('url-preview-box');

  targetSubjInput.value = subjectId;
  previewBox.style.display = 'none';

  const subj = appData.subjects.find(s => s.id === subjectId);
  const subjName = subj ? subj.name : 'Subject';

  if (linkId) {
    const link = (subj.links || []).find(l => l.id === linkId);
    if (!link) return;
    modalTitle.textContent = `Edit Link in ${subjName}`;
    editLinkIdInput.value = link.id;
    titleInput.value = link.title;
    urlInput.value = link.url;
    notesInput.value = link.notes || '';

    // Show preview if valid video ID exists
    updateModalPreview(link.url);
  } else {
    modalTitle.textContent = `Add YouTube Link to ${subjName}`;
    editLinkIdInput.value = '';
    titleInput.value = '';
    urlInput.value = '';
    notesInput.value = '';
  }

  openModal('link-modal');
  setTimeout(() => titleInput.focus(), 100);
};

/**
 * Live URL Preview in Modal
 */
function handleLinkUrlPreview(e) {
  const url = e.target.value.trim();
  updateModalPreview(url);
}

function updateModalPreview(url) {
  const previewBox = document.getElementById('url-preview-box');
  const previewImg = document.getElementById('preview-thumb-img');
  const previewIdTag = document.getElementById('preview-video-id');

  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    previewBox.style.display = 'flex';
    previewImg.src = getYouTubeThumbnail(videoId);
    previewIdTag.textContent = `Video ID: ${videoId}`;
  } else {
    previewBox.style.display = 'none';
  }
}

/**
 * Handle Link Form Submission
 */
function handleLinkFormSubmit(e) {
  e.preventDefault();
  const subjectId = document.getElementById('target-subject-id').value;
  const editLinkId = document.getElementById('edit-link-id').value;
  const title = document.getElementById('link-title-input').value.trim();
  const rawUrl = document.getElementById('link-url-input').value.trim();
  const notes = document.getElementById('link-notes-input').value.trim();

  if (!title || !rawUrl) {
    showToast('Please provide both video title and YouTube URL', 'error');
    return;
  }

  let formattedUrl = rawUrl;
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const subj = appData.subjects.find(s => s.id === subjectId);
  if (!subj) {
    showToast('Subject not found', 'error');
    return;
  }

  subj.links = subj.links || [];
  const videoId = extractYouTubeVideoId(formattedUrl);

  if (editLinkId) {
    // Edit Link
    const link = subj.links.find(l => l.id === editLinkId);
    if (link) {
      link.title = title;
      link.url = formattedUrl;
      link.notes = notes;
      link.videoId = videoId;
      saveAppData();
      showToast('YouTube link updated!', 'success');
    }
  } else {
    // Add New Link
    const newLink = {
      id: 'lnk_' + Date.now(),
      title,
      url: formattedUrl,
      notes,
      videoId,
      createdAt: Date.now()
    };
    subj.links.unshift(newLink);
    saveAppData();
    showToast(`Link added to "${subj.name}"!`, 'success');
  }

  closeModal('link-modal');
  renderApp();
}

/**
 * Handle Top Quick Add Bar Submission
 */
function handleQuickAddLink(e) {
  e.preventDefault();
  const select = document.getElementById('quick-subject-select');
  const titleInput = document.getElementById('quick-link-title');
  const urlInput = document.getElementById('quick-link-url');

  const subjectId = select.value;
  const title = titleInput.value.trim();
  const rawUrl = urlInput.value.trim();

  if (!subjectId) {
    showToast('Please select a subject from the list', 'error');
    select.focus();
    return;
  }

  if (!title || !rawUrl) {
    showToast('Please enter both title and YouTube URL', 'error');
    return;
  }

  let formattedUrl = rawUrl;
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const subj = appData.subjects.find(s => s.id === subjectId);
  if (!subj) return;

  subj.links = subj.links || [];
  const videoId = extractYouTubeVideoId(formattedUrl);

  subj.links.unshift({
    id: 'lnk_' + Date.now(),
    title,
    url: formattedUrl,
    notes: '',
    videoId,
    createdAt: Date.now()
  });

  saveAppData();
  showToast(`Added link to "${subj.name}"!`, 'success');

  // Reset form inputs
  titleInput.value = '';
  urlInput.value = '';
  renderApp();
}

/**
 * Delete a Link from a Subject
 */
window.deleteLink = function(subjectId, linkId) {
  const subj = appData.subjects.find(s => s.id === subjectId);
  if (!subj) return;

  const link = (subj.links || []).find(l => l.id === linkId);
  const linkTitle = link ? link.title : 'this link';

  if (confirm(`Remove "${linkTitle}"?`)) {
    subj.links = subj.links.filter(l => l.id !== linkId);
    saveAppData();
    showToast('YouTube link removed', 'info');
    renderApp();
  }
};

/* ===================================================
   Video Preview Modal & Player
   =================================================== */

window.openPlayerModal = function(title, videoId, url, notes) {
  const modal = document.getElementById('player-modal');
  const titleEl = document.getElementById('player-video-title');
  const iframe = document.getElementById('player-iframe');
  const notesEl = document.getElementById('player-meta-notes');
  const directBtn = document.getElementById('player-direct-btn');

  titleEl.textContent = title;
  notesEl.textContent = notes ? `Note: ${notes}` : '';
  directBtn.href = url;

  if (videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else {
    iframe.src = '';
  }

  openModal('player-modal');
};

window.closePlayerModal = function() {
  const iframe = document.getElementById('player-iframe');
  if (iframe) {
    iframe.src = ''; // Stops playback immediately
  }
  closeModal('player-modal');
};

/* ===================================================
   Backup & Restore Functions
   =================================================== */

function handleExportJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `study_library_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup JSON exported successfully!', 'success');
}

function handleImportJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported && Array.isArray(imported.subjects)) {
        appData = imported;
        saveAppData();
        closeModal('backup-modal');
        renderApp();
        showToast('Data imported successfully!', 'success');
      } else {
        showToast('Invalid backup file structure.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error parsing JSON backup file.', 'error');
    }
    e.target.value = ''; // Reset input
  };
  reader.readAsText(file);
}

function handleResetDemo() {
  if (confirm('Reset your study library back to the default sample subjects? (Your current data will be overwritten)')) {
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveAppData();
    closeModal('backup-modal');
    renderApp();
    showToast('Reset to sample subjects!', 'info');
  }
}

/* ===================================================
   Modal Helpers & UI Utilities
   =================================================== */

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
};

function formatDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch (e) {
    return 'youtube.com';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}
