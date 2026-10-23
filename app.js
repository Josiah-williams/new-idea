/**
 * TaskPulse - Modern To-Do & Task Management Application
 * Pure Vanilla JavaScript implementation with LocalStorage and Web Audio API
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'taskpulse_tasks_data';
  const SOUND_STORAGE_KEY = 'taskpulse_sound_enabled';

  // Initial demo data if first visit
  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      text: 'Design sleek user interface for project kickoff',
      completed: true,
      priority: 'high',
      category: 'work',
      dueDate: getRelativeDateString(0),
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: 'task-2',
      text: 'Review documentation and system architecture',
      completed: false,
      priority: 'medium',
      category: 'study',
      dueDate: getRelativeDateString(1),
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'task-3',
      text: '30-minute cardio & stretch workout session',
      completed: false,
      priority: 'low',
      category: 'fitness',
      dueDate: getRelativeDateString(0),
      createdAt: Date.now() - 3600000
    }
  ];

  // Helper to get ISO date string relative to today
  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  // --- State ---
  let tasks = loadTasks();
  let currentFilter = 'all'; // 'all' | 'active' | 'completed'
  let currentCategory = 'all';
  let searchQuery = '';
  let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  let toastTimeout = null;

  // --- DOM Elements ---
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const categorySelect = document.getElementById('category-select');
  const dueDateInput = document.getElementById('due-date-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const addSampleTasksBtn = document.getElementById('add-sample-tasks-btn');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterCategorySelect = document.getElementById('filter-category');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const toastEl = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');

  // Stats elements
  const completedCountEl = document.getElementById('completed-count');
  const totalCountEl = document.getElementById('total-count');
  const progressBar = document.getElementById('progress-bar');
  const progressCircle = document.getElementById('progress-circle');
  const progressPercentText = document.getElementById('progress-percentage');
  const itemsLeftCount = document.getElementById('items-left-count');
  const badgeAll = document.getElementById('badge-all');
  const badgeActive = document.getElementById('badge-active');
  const badgeCompleted = document.getElementById('badge-completed');

  // Greeting & Date
  const greetingText = document.getElementById('greeting-text');
  const currentDateBadge = document.getElementById('current-date-badge');

  // --- Audio Synthesis (Web Audio API) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type, duration, startTime = 0) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + startTime);
      osc.stop(audioCtx.currentTime + startTime + duration);
    } catch (e) {
      // Audio might be blocked until user gesture
    }
  }

  function playSound(action) {
    if (!soundEnabled) return;
    if (action === 'add') {
      playTone(480, 'sine', 0.08);
      playTone(680, 'sine', 0.12, 0.06);
    } else if (action === 'complete') {
      playTone(523.25, 'sine', 0.12); // C5
      playTone(659.25, 'sine', 0.14, 0.08); // E5
      playTone(783.99, 'sine', 0.22, 0.16); // G5
    } else if (action === 'uncomplete') {
      playTone(400, 'triangle', 0.1);
    } else if (action === 'delete') {
      playTone(280, 'sawtooth', 0.12);
    }
  }

  // --- Storage Functions ---
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return [...DEFAULT_TASKS];
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  // --- Notification Toast ---
  function showToast(message, icon = '✨') {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    const iconEl = toastEl.querySelector('.toast-icon');
    if (iconEl) iconEl.textContent = icon;
    toastMsg.textContent = message;
    toastEl.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2400);
  }

  // --- Date & Greeting Logic ---
  function updateHeaderInfo() {
    const now = new Date();
    const hours = now.getHours();

    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon';
    } else if (hours >= 17 || hours < 5) {
      greeting = 'Good evening';
    }

    greetingText.textContent = `${greeting}, ready to conquer your goals?`;

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    currentDateBadge.textContent = now.toLocaleDateString(undefined, options);
  }

  // --- Category Badges & Emojis ---
  function getCategoryLabel(cat) {
    const map = {
      work: '💼 Work',
      personal: '🌱 Personal',
      study: '📚 Study',
      fitness: '⚡ Fitness',
      general: '📌 General'
    };
    return map[cat] || '📌 General';
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const taskDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskDate < today;
  }

  // --- Statistics Calculation ---
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update numbers
    totalCountEl.textContent = total;
    completedCountEl.textContent = completed;
    itemsLeftCount.textContent = `${active} item${active === 1 ? '' : 's'} remaining`;

    // Filter badge counts
    badgeAll.textContent = total;
    badgeActive.textContent = active;
    badgeCompleted.textContent = completed;

    // Progress bar fill
    progressBar.style.width = `${percent}%`;

    // Circular progress SVG
    const radius = 28;
    const circumference = 2 * Math.PI * radius; // ~175.929
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    progressPercentText.textContent = `${percent}%`;
  }

  // --- Rendering Tasks ---
  function renderTasks() {
    taskList.innerHTML = '';

    // Apply Filters
    const filteredTasks = tasks.filter(task => {
      // Status filter
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;

      // Category filter
      if (currentCategory !== 'all' && task.category !== currentCategory) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesText = task.text.toLowerCase().includes(query);
        const matchesCat = (task.category || '').toLowerCase().includes(query);
        const matchesPriority = (task.priority || '').toLowerCase().includes(query);
        if (!matchesText && !matchesCat && !matchesPriority) return false;
      }

      return true;
    });

    if (filteredTasks.length === 0) {
      emptyState.classList.remove('hidden');
      const emptyTitle = document.getElementById('empty-state-title');
      const emptyDesc = document.getElementById('empty-state-desc');

      if (searchQuery.trim() !== '') {
        emptyTitle.textContent = 'No matching tasks';
        emptyDesc.textContent = `No tasks found matching "${searchQuery}". Try adjusting your search.`;
      } else if (currentFilter === 'active' && tasks.some(t => t.completed)) {
        emptyTitle.textContent = 'All clear!';
        emptyDesc.textContent = 'You have tackled all active tasks. Great job!';
      } else if (currentFilter === 'completed') {
        emptyTitle.textContent = 'No completed tasks yet';
        emptyDesc.textContent = 'Mark tasks as complete to see your achievements here.';
      } else {
        emptyTitle.textContent = 'No tasks in this view';
        emptyDesc.textContent = 'Add a new task above or load the sample list to get started.';
      }
    } else {
      emptyState.classList.add('hidden');

      filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);

        // Checkbox button
        const checkBtn = document.createElement('button');
        checkBtn.className = 'task-checkbox-btn';
        checkBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        checkBtn.setAttribute('aria-label', checkBtn.title);
        checkBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        checkBtn.addEventListener('click', () => toggleTaskComplete(task.id));

        // Content
        const taskLeft = document.createElement('div');
        taskLeft.className = 'task-left';

        const content = document.createElement('div');
        content.className = 'task-content';

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = task.text;

        // Tags wrapper
        const tags = document.createElement('div');
        tags.className = 'task-tags';

        // Priority Badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `badge badge-priority-${task.priority || 'medium'}`;
        priorityBadge.textContent = task.priority || 'medium';
        tags.appendChild(priorityBadge);

        // Category Badge
        if (task.category) {
          const categoryBadge = document.createElement('span');
          categoryBadge.className = `badge badge-category-${task.category}`;
          categoryBadge.textContent = getCategoryLabel(task.category);
          tags.appendChild(categoryBadge);
        }

        // Due date badge if specified
        if (task.dueDate) {
          const dateBadge = document.createElement('span');
          const overdue = !task.completed && isOverdue(task.dueDate);
          dateBadge.className = `badge badge-date ${overdue ? 'overdue' : ''}`;
          dateBadge.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${overdue ? 'Overdue: ' : ''}${formatDateDisplay(task.dueDate)}
          `;
          tags.appendChild(dateBadge);
        }

        content.appendChild(title);
        content.appendChild(tags);

        taskLeft.appendChild(checkBtn);
        taskLeft.appendChild(content);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.title = 'Edit task';
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        `;
        editBtn.addEventListener('click', () => startInlineEdit(task.id, li));

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.title = 'Delete task';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        `;
        deleteBtn.addEventListener('click', () => deleteTaskWithAnimation(task.id, li));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(taskLeft);
        li.appendChild(actions);

        taskList.appendChild(li);
      });
    }

    updateStats();
  }

  // --- Inline Edit Mode ---
  function startInlineEdit(taskId, liElement) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const originalContent = liElement.innerHTML;

    liElement.innerHTML = `
      <form class="task-edit-form" autocomplete="off">
        <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}" maxlength="150" required />
        <button type="submit" class="task-edit-save-btn">Save</button>
        <button type="button" class="task-edit-cancel-btn">Cancel</button>
      </form>
    `;

    const input = liElement.querySelector('.task-edit-input');
    const form = liElement.querySelector('.task-edit-form');
    const cancelBtn = liElement.querySelector('.task-edit-cancel-btn');

    input.focus();
    input.select();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newText = input.value.trim();
      if (newText) {
        task.text = newText;
        saveTasks();
        renderTasks();
        showToast('Task updated successfully', '✏️');
      }
    });

    cancelBtn.addEventListener('click', () => {
      liElement.innerHTML = originalContent;
      renderTasks(); // Rebind events cleanly
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
  }

  function escapeHtml(string) {
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Task Actions ---
  function addTask(text, priority, category, dueDate) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      text: text.trim(),
      completed: false,
      priority: priority || 'medium',
      category: category || 'general',
      dueDate: dueDate || '',
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    playSound('add');
    showToast('New task added', '✨');
  }

  function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderTasks();

    if (task.completed) {
      playSound('complete');
      showToast('Task marked completed!', '🎉');
    } else {
      playSound('uncomplete');
    }
  }

  function deleteTaskWithAnimation(taskId, liElement) {
    playSound('delete');
    liElement.classList.add('removing');

    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      renderTasks();
      showToast('Task removed', '🗑️');
    }, 280);
  }

  function clearCompletedTasks() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) {
      showToast('No completed tasks to clear', 'ℹ️');
      return;
    }

    playSound('delete');
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    showToast(`Cleared ${count} completed task${count === 1 ? '' : 's'}`, '🧹');
  }

  function loadSampleTasks() {
    tasks = [...DEFAULT_TASKS];
    saveTasks();
    renderTasks();
    playSound('add');
    showToast('Sample tasks loaded', '📋');
  }

  // --- Event Listeners ---
  function initEventListeners() {
    // New task submit
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = taskInput.value.trim();
      if (!text) return;

      const priority = prioritySelect.value;
      const category = categorySelect.value;
      const dueDate = dueDateInput.value;

      addTask(text, priority, category, dueDate);

      taskInput.value = '';
      taskInput.focus();
    });

    // Tab Filters (All, Active, Completed)
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentFilter = tab.getAttribute('data-filter');
        renderTasks();
      });
    });

    // Category Filter Dropdown
    filterCategorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderTasks();
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.trim() !== '') {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderTasks();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderTasks();
      searchInput.focus();
    });

    // Clear completed button
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    // Load samples button
    addSampleTasksBtn.addEventListener('click', loadSampleTasks);

    // Audio toggle
    updateSoundUI();
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled);
      updateSoundUI();
      if (soundEnabled) {
        playSound('add');
        showToast('Sound effects enabled', '🔔');
      } else {
        showToast('Sound effects muted', '🔕');
      }
    });

    // Keyboard shortcuts (e.g., '/' to focus search)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== taskInput && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  function updateSoundUI() {
    if (soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      soundToggleBtn.title = 'Mute sound effects';
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      soundToggleBtn.title = 'Enable sound effects';
    }
  }

  // --- Initialize App ---
  function init() {
    updateHeaderInfo();
    initEventListeners();
    renderTasks();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
