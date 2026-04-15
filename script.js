// Auth guard - redirect to login if not authenticated
if (localStorage.getItem("btb_logged_in") !== "true") {
  window.location.href = "index.html";
}

// Logout handler
function logout() {
  localStorage.removeItem("btb_logged_in");
  localStorage.removeItem("btb_username");
  window.location.href = "index.html";
}

// Navigation
const links = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.page;
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    pages.forEach(p => p.classList.add('hidden'));
    const nextPage = document.getElementById(target);
    nextPage.classList.remove('hidden');
    // Trigger slide-in animation
    nextPage.classList.remove('page-enter');
    void nextPage.offsetWidth; // force reflow
    nextPage.classList.add('page-enter');

    // Re-trigger bar chart animation when entering overview
    if (target === 'overview') {
      replayBarChartAnimation();
    }
  });
});

function replayBarChartAnimation() {
  const bars = ['bar-pending', 'bar-ongoing', 'bar-completed'];
  bars.forEach((id, idx) => {
    const bar = document.getElementById(id);
    if (!bar) return;
    const targetHeight = bar.style.height;
    bar.style.transition = 'none';
    bar.style.height = '0%';
    void bar.offsetWidth; // force reflow
    bar.style.transition = `height 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.12}s`;
    bar.style.height = targetHeight;
  });
}

// Create Task button -> jump to tasks page
document.getElementById('create-task-btn').addEventListener('click', () => {
  document.querySelector('[data-page="tasks"]').click();
  document.getElementById('new-task').focus();
});

// Welcome banner - dynamic greeting, datetime, quotes, stat chips
const QUOTES = [
  "Small steps every day add up.",
  "Done is better than perfect.",
  "Clarity beats speed.",
  "Focus on one thing at a time.",
  "Ship it, then improve it.",
  "The best time to start was yesterday. Next best is now.",
  "Progress, not perfection.",
  "Build momentum, not stress.",
  "Quality is a habit, not an act.",
  "Today's effort is tomorrow's result.",
  "Consistency beats intensity.",
  "Systems beat goals.",
  "Simple scales. Clever doesn't.",
];

function getGreeting() {
  const hour = new Date().getHours();
  const rawName = localStorage.getItem('btb_username') || 'Team';
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  if (hour < 5) return `Working late, ${name}?`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 21) return `Good evening, ${name}`;
  return `Burning the midnight oil, ${name}?`;
}

function updateWelcome() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const dt = document.getElementById('welcome-datetime');
  const greet = document.getElementById('welcome-greeting');
  if (dt) dt.textContent = `${dateStr} · ${timeStr}`;
  if (greet) greet.textContent = getGreeting();
}

function updateWelcomeQuote() {
  // Pick a quote based on the day so it stays stable for the day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];
  const el = document.getElementById('welcome-quote');
  if (el) el.textContent = `"${quote}"`;
}

function updateWelcomeChips() {
  const container = document.getElementById('welcome-chips');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const dueToday = tasks.filter(t =>
    t.status !== 'completed' && t.due && t.due === todayKey
  ).length;

  const overdue = tasks.filter(t =>
    t.status !== 'completed' && t.due && new Date(t.due + 'T00:00:00') < today
  ).length;

  const pending = tasks.filter(t => t.status === 'pending').length;
  const ongoing = tasks.filter(t => t.status === 'ongoing').length;

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const doneThisWeek = tasks.filter(t =>
    t.status === 'completed' && t.created && new Date(t.created) >= weekAgo
  ).length;

  const todaysReminders = (reminders && reminders[todayKey]) ? reminders[todayKey].length : 0;

  const chips = [];

  if (overdue > 0) {
    chips.push({ label: 'overdue', count: overdue, cls: 'urgent', filter: 'overdue' });
  }
  if (dueToday > 0) {
    chips.push({ label: 'due today', count: dueToday, cls: 'urgent' });
  }
  if (ongoing > 0) {
    chips.push({ label: 'ongoing', count: ongoing, filter: 'ongoing' });
  }
  if (pending > 0) {
    chips.push({ label: 'pending', count: pending, filter: 'pending' });
  }
  if (todaysReminders > 0) {
    chips.push({ label: `reminder${todaysReminders > 1 ? 's' : ''} today`, count: todaysReminders });
  }
  if (doneThisWeek > 0) {
    chips.push({ label: 'done this week', count: doneThisWeek, cls: 'success' });
  }

  if (chips.length === 0) {
    chips.push({ label: 'all clear - add a task to get started', count: '✓', cls: 'success' });
  }

  container.innerHTML = chips.map(c => `
    <div class="welcome-chip ${c.cls || ''}" ${c.filter ? `data-chip-filter="${c.filter}"` : ''}>
      <span class="welcome-chip-dot"></span>
      <strong>${c.count}</strong> ${c.label}
    </div>
  `).join('');

  // Make filter chips navigate to Tasks with that filter
  container.querySelectorAll('[data-chip-filter]').forEach(el => {
    el.addEventListener('click', () => {
      const f = el.dataset.chipFilter;
      document.querySelector('[data-page="tasks"]').click();
      setTaskFilterChip(f);
    });
  });
}

updateWelcome();
updateWelcomeQuote();
setInterval(updateWelcome, 60000); // Refresh time every minute

// Clickable cards -> navigate to page (with optional filter)
document.querySelectorAll('.clickable[data-nav]').forEach(card => {
  card.addEventListener('click', () => {
    const nav = card.dataset.nav;
    const filter = card.dataset.filter;
    document.querySelector(`[data-page="${nav}"]`).click();
    if (filter && nav === 'tasks') {
      // Wait for filter chips to be ready, then apply and update UI
      setTimeout(() => setTaskFilterChip(filter), 0);
    }
  });
});

// Clients (dynamic)
let clients = JSON.parse(localStorage.getItem('clients') || '[]');

// Migrate old format { name, code } to full format
clients = clients.map(c => ({
  name: c.name,
  code: c.code || '',
  status: c.status || 'active',
  priority: c.priority || 'medium',
  start: c.start || '',
  contact: c.contact || '',
  email: c.email || '',
  notes: c.notes || '',
}));

const clientGrid = document.getElementById('client-grid');
const addClientBtn = document.getElementById('add-client');
const clearClientFormBtn = document.getElementById('clear-client-form');
const formToggleBtn = document.getElementById('form-toggle');
const clientFormBody = document.getElementById('client-form-body');
const clientDetail = document.getElementById('client-detail');
const clientDetailContent = document.getElementById('client-detail-content');

const clientFormFields = {
  name: document.getElementById('new-client-name'),
  code: document.getElementById('new-client-code'),
  status: document.getElementById('new-client-status'),
  priority: document.getElementById('new-client-priority'),
  start: document.getElementById('new-client-start'),
  contact: document.getElementById('new-client-contact'),
  email: document.getElementById('new-client-email'),
  notes: document.getElementById('new-client-notes'),
};

function saveClients() {
  localStorage.setItem('clients', JSON.stringify(clients));
  const activeCount = clients.filter(c => c.status === 'active').length;
  const miniCards = document.querySelectorAll('.mini-card-value');
  if (miniCards[0]) miniCards[0].textContent = activeCount;
  if (miniCards[2]) miniCards[2].textContent = clients.length;
  refreshClientDropdown();
}

function renderClients() {
  clientGrid.innerHTML = '';

  if (clients.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'client-empty';
    empty.textContent = 'No clients yet. Add one above to get started.';
    clientGrid.appendChild(empty);
    clientDetail.classList.add('hidden');
    return;
  }

  clients.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'client-card clickable';
    card.dataset.client = c.name;
    card.dataset.index = i;
    card.innerHTML = `
      <div class="client-priority-marker ${c.priority || 'medium'}"></div>
      <button class="client-delete" data-delete="${i}" title="Remove client">×</button>
      <h4>${c.name}</h4>
      <span>${c.code || 'No project code'}</span>
      <div class="client-status ${c.status || 'active'}">${c.status || 'active'}</div>
    `;
    clientGrid.appendChild(card);
  });
}

function clearClientForm() {
  clientFormFields.name.value = '';
  clientFormFields.code.value = '';
  clientFormFields.status.value = 'active';
  clientFormFields.priority.value = 'medium';
  clientFormFields.start.value = '';
  clientFormFields.contact.value = '';
  clientFormFields.email.value = '';
  clientFormFields.notes.value = '';
}

function addClient() {
  const name = clientFormFields.name.value.trim();
  if (!name) {
    clientFormFields.name.style.borderColor = 'var(--danger)';
    setTimeout(() => { clientFormFields.name.style.borderColor = ''; }, 1500);
    clientFormFields.name.focus();
    return;
  }

  clients.push({
    name,
    code: clientFormFields.code.value.trim(),
    status: clientFormFields.status.value,
    priority: clientFormFields.priority.value,
    start: clientFormFields.start.value,
    contact: clientFormFields.contact.value.trim(),
    email: clientFormFields.email.value.trim(),
    notes: clientFormFields.notes.value.trim(),
  });

  clearClientForm();
  saveClients();
  renderClients();
  clientFormFields.name.focus();
}

addClientBtn.addEventListener('click', addClient);
clearClientFormBtn.addEventListener('click', clearClientForm);

// Enter in simple inputs triggers add (except textarea)
['name', 'code', 'contact', 'email'].forEach(key => {
  clientFormFields[key].addEventListener('keydown', e => {
    if (e.key === 'Enter') addClient();
  });
});

// Collapse/expand form
formToggleBtn.addEventListener('click', () => {
  const isCollapsed = clientFormBody.classList.toggle('collapsed');
  formToggleBtn.textContent = isCollapsed ? '+' : '−';
  formToggleBtn.title = isCollapsed ? 'Expand' : 'Collapse';
});

function renderClientDetail(c) {
  const fmtDate = c.start ? new Date(c.start + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const field = (label, value, full = false) => {
    const isEmpty = !value;
    return `
      <div class="detail-item${full ? ' full' : ''}">
        <span class="detail-label">${label}</span>
        <span class="detail-value${isEmpty ? ' empty' : ''}">${isEmpty ? 'Not set' : value}</span>
      </div>
    `;
  };

  clientDetailContent.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
      <h3 style="margin:0;">${c.name}</h3>
      <span class="client-status ${c.status}">${c.status}</span>
      <span class="client-status" style="background:var(--bg); color:var(--muted);">Priority: ${c.priority}</span>
    </div>
    <div class="detail-grid">
      ${field('Project Code', c.code)}
      ${field('Start Date', fmtDate)}
      ${field('Contact', c.contact)}
      ${field('Email', c.email ? `<a href="mailto:${c.email}" style="color:var(--accent);">${c.email}</a>` : '')}
      ${field('Notes', c.notes, true)}
    </div>
  `;
}

clientGrid.addEventListener('click', e => {
  // Delete button
  if (e.target.dataset.delete !== undefined) {
    e.stopPropagation();
    const i = parseInt(e.target.dataset.delete, 10);
    if (!confirm(`Remove ${clients[i].name}?`)) return;
    clients.splice(i, 1);
    saveClients();
    renderClients();
    clientDetail.classList.add('hidden');
    return;
  }

  const card = e.target.closest('.client-card.clickable');
  if (!card) return;
  document.querySelectorAll('.client-card.clickable').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  const i = parseInt(card.dataset.index, 10);
  renderClientDetail(clients[i]);
  clientDetail.classList.remove('hidden');
});

// Task filter logic
let currentFilter = 'all';
let currentClientFilter = 'all';
let currentPriorityFilter = 'all';
let currentSort = 'created-desc';

function applyTaskFilter(status) {
  currentFilter = status;
  renderTasks();
}

function clearTaskFilter() {
  currentFilter = 'all';
  document.querySelectorAll('.task-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tfilter === 'all');
  });
  renderTasks();
}

function setTaskFilterChip(status) {
  currentFilter = status;
  document.querySelectorAll('.task-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tfilter === status);
  });
  renderTasks();
}

function highlightTaskByText(text) {
  const items = document.querySelectorAll('#task-list .task-item');
  items.forEach(el => {
    const textEl = el.querySelector('.task-text');
    if (textEl && textEl.textContent === text) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('task-flash');
      setTimeout(() => el.classList.remove('task-flash'), 1800);
    }
  });
}

// Tasks
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

// Migrate old task format to include priority/due/client/notes
tasks = tasks.map(t => ({
  text: t.text,
  status: t.status || 'pending',
  priority: t.priority || 'medium',
  due: t.due || '',
  client: t.client || '',
  notes: t.notes || '',
  created: t.created || Date.now(),
}));

const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task');
const taskStatus = document.getElementById('task-status');
const taskPriority = document.getElementById('task-priority');
const taskDue = document.getElementById('task-due');
const taskClient = document.getElementById('task-client');
const taskNotes = document.getElementById('task-notes');
const addTaskBtn = document.getElementById('add-task');
const clearTaskFormBtn = document.getElementById('clear-task-form');
const taskFormToggle = document.getElementById('task-form-toggle');
const taskFormBody = document.getElementById('task-form-body');

// Rebuild client dropdown when clients change
function refreshClientDropdown() {
  if (!taskClient) return;
  const current = taskClient.value;
  taskClient.innerHTML = '<option value="">— None —</option>' +
    clients.map(c => `<option value="${c.name}">${c.name}${c.code ? ' (' + c.code + ')' : ''}</option>`).join('');
  taskClient.value = current;
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateAll();
}

function renderTasks() {
  taskList.innerHTML = '';

  // Filter banner if a filter is active
  if (currentFilter !== 'all') {
    const banner = document.createElement('div');
    banner.className = 'filter-banner';
    banner.innerHTML = `
      <span>Showing: <strong>${currentFilter.toUpperCase()}</strong> tasks</span>
      <button id="clear-filter">Clear filter</button>
    `;
    taskList.appendChild(banner);
    banner.querySelector('#clear-filter').addEventListener('click', clearTaskFilter);
  }

  let visible;
  if (currentFilter === 'all') {
    visible = tasks.slice();
  } else if (currentFilter === 'overdue') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    visible = tasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due + 'T00:00:00') < today);
  } else {
    visible = tasks.filter(t => t.status === currentFilter);
  }

  // Client filter
  if (currentClientFilter && currentClientFilter !== 'all') {
    visible = visible.filter(t => (t.client || '') === currentClientFilter);
  }

  // Priority filter
  if (currentPriorityFilter && currentPriorityFilter !== 'all') {
    visible = visible.filter(t => (t.priority || '') === currentPriorityFilter);
  }

  // Sort
  const priorityRank = { high: 0, medium: 1, low: 2, '': 3 };
  const farFuture = 8640000000000000;
  const sortFns = {
    'created-desc': (a, b) => (b.created || 0) - (a.created || 0),
    'created-asc': (a, b) => (a.created || 0) - (b.created || 0),
    'due-asc': (a, b) => (a.due ? new Date(a.due).getTime() : farFuture) - (b.due ? new Date(b.due).getTime() : farFuture),
    'due-desc': (a, b) => (b.due ? new Date(b.due).getTime() : -1) - (a.due ? new Date(a.due).getTime() : -1),
    'priority': (a, b) => (priorityRank[a.priority || ''] ?? 3) - (priorityRank[b.priority || ''] ?? 3),
  };
  if (currentSort !== 'custom') {
    visible.sort(sortFns[currentSort] || sortFns['created-desc']);
  }

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'color: var(--muted); padding: 16px; list-style: none;';
    empty.textContent = tasks.length === 0 ? 'No tasks yet. Add one above.' : 'No tasks match this filter.';
    taskList.appendChild(empty);
    return;
  }

  visible.forEach((task) => {
    const realIndex = tasks.indexOf(task);
    const li = document.createElement('li');
    let liClass = 'task-item' + (task.status === 'completed' ? ' done' : '');
    li.dataset.index = realIndex;
    li.draggable = task.status !== 'completed';

    const meta = [];
    if (task.due) {
      const dueDate = new Date(task.due + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.round((dueDate - now) / 86400000);
      let dueLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let chipClass = 'task-meta-chip';

      if (task.status !== 'completed') {
        if (diffDays < 0) {
          chipClass += ' overdue';
          liClass += ' is-overdue';
          dueLabel = `⚠ Overdue · ${dueLabel}`;
        } else if (diffDays === 0) {
          chipClass += ' due-today';
          liClass += ' is-due-today';
          dueLabel = `● Due today`;
        } else if (diffDays <= 2) {
          chipClass += ' due-soon';
          liClass += ' is-due-soon';
          dueLabel = `Due in ${diffDays}d`;
        } else {
          dueLabel = `Due ${dueLabel}`;
        }
      } else {
        dueLabel = `Was due ${dueLabel}`;
      }
      meta.push(`<span class="${chipClass}">📅 ${dueLabel}</span>`);
    }
    li.className = liClass;

    if (task.priority && task.priority !== 'medium') {
      meta.push(`<span class="task-meta-chip priority-${task.priority}">${task.priority.toUpperCase()}</span>`);
    }

    if (task.client) {
      meta.push(`<span class="task-meta-chip">◈ ${task.client}</span>`);
    }

    const notesHtml = task.notes ? `<div class="task-notes">${task.notes}</div>` : '';
    const metaHtml = meta.length ? `<div class="task-meta">${meta.join('')}</div>` : '';

    li.innerHTML = `
      <div class="task-priority-marker ${task.priority || 'medium'}"></div>
      <span class="task-badge ${task.status}" data-action="cycle" data-index="${realIndex}" title="Click to cycle status">${task.status}</span>
      <div class="task-item-body">
        <span class="task-text" data-action="toggle" data-index="${realIndex}" title="Click to mark done · Double-click to edit">${task.text}</span>
        ${metaHtml}
        ${notesHtml}
      </div>
      <button class="task-edit" data-action="edit" data-index="${realIndex}" title="Edit">✎</button>
      <button class="delete" data-action="delete" data-index="${realIndex}">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

const STATUS_CYCLE = { pending: 'ongoing', ongoing: 'completed', completed: 'pending' };

function cycleStatus(i) {
  tasks[i].status = STATUS_CYCLE[tasks[i].status] || 'pending';
  saveTasks();
  renderTasks();
}

function toggleDone(i) {
  tasks[i].status = tasks[i].status === 'completed' ? 'pending' : 'completed';
  saveTasks();
  renderTasks();
}

function editTask(i) {
  const current = tasks[i].text;
  const next = prompt('Edit task:', current);
  if (next === null) return;
  const trimmed = next.trim();
  if (!trimmed) return;
  tasks[i].text = trimmed;
  saveTasks();
  renderTasks();
}

function clearTaskForm() {
  newTaskInput.value = '';
  taskStatus.value = 'pending';
  taskPriority.value = 'medium';
  taskDue.value = '';
  taskClient.value = '';
  taskNotes.value = '';
}

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) {
    newTaskInput.style.borderColor = 'var(--danger)';
    newTaskInput.placeholder = 'Type something first...';
    setTimeout(() => {
      newTaskInput.style.borderColor = '';
      newTaskInput.placeholder = 'What needs to get done?';
    }, 1500);
    newTaskInput.focus();
    return;
  }
  tasks.push({
    text,
    status: taskStatus.value,
    priority: taskPriority.value,
    due: taskDue.value,
    client: taskClient.value,
    notes: taskNotes.value.trim(),
    created: Date.now(),
  });
  clearTaskForm();
  saveTasks();
  renderTasks();
  newTaskInput.focus();
}

addTaskBtn.addEventListener('click', addTask);
clearTaskFormBtn.addEventListener('click', clearTaskForm);
newTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

taskFormToggle.addEventListener('click', () => {
  const isCollapsed = taskFormBody.classList.toggle('collapsed');
  taskFormToggle.textContent = isCollapsed ? '+' : '−';
  taskFormToggle.title = isCollapsed ? 'Expand' : 'Collapse';
});

// Filter chips
document.querySelectorAll('.task-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.task-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.tfilter;
    renderTasks();
  });
});

taskList.addEventListener('click', e => {
  const action = e.target.dataset.action;
  const i = parseInt(e.target.dataset.index, 10);
  if (isNaN(i)) return;

  if (action === 'delete') {
    if (!confirm('Delete this task?')) return;
    tasks.splice(i, 1);
    saveTasks();
    renderTasks();
  } else if (action === 'cycle') {
    cycleStatus(i);
  } else if (action === 'toggle') {
    toggleDone(i);
  } else if (action === 'edit') {
    editTask(i);
  }
});

taskList.addEventListener('dblclick', e => {
  const action = e.target.dataset.action;
  const i = parseInt(e.target.dataset.index, 10);
  if (action === 'toggle' && !isNaN(i)) {
    editTask(i);
  }
});

// Stats + charts
function animateCount(el, target) {
  if (!el) return;
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) return;

  const duration = 500;
  const start = performance.now();
  const delta = target - current;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(current + delta * eased);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateAll() {
  if (typeof renderProgress === 'function') renderProgress();
  if (typeof updateWelcomeChips === 'function') updateWelcomeChips();
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const ongoing = tasks.filter(t => t.status === 'ongoing').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  animateCount(document.getElementById('stat-total'), total);
  animateCount(document.getElementById('stat-pending'), pending);
  animateCount(document.getElementById('stat-ongoing'), ongoing);
  animateCount(document.getElementById('stat-completed'), completed);

  animateCount(document.getElementById('leg-pending'), pending);
  animateCount(document.getElementById('leg-ongoing'), ongoing);
  animateCount(document.getElementById('leg-completed'), completed);

  // Bar chart - heights based on max count (each bar scales 0-100%)
  const max = Math.max(pending, ongoing, completed, 1);
  const pendingBar = document.getElementById('bar-pending');
  const ongoingBar = document.getElementById('bar-ongoing');
  const completedBar = document.getElementById('bar-completed');
  if (pendingBar) pendingBar.style.height = (pending / max * 100) + '%';
  if (ongoingBar) ongoingBar.style.height = (ongoing / max * 100) + '%';
  if (completedBar) completedBar.style.height = (completed / max * 100) + '%';

  // Completion ring
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const ring = document.querySelector('.progress-ring');
  ring.style.background = `conic-gradient(var(--accent) 0% ${rate}%, var(--border) ${rate}% 100%)`;
  const rateEl = document.getElementById('completion-rate');
  if (rateEl) {
    const currentRate = parseInt(rateEl.textContent, 10) || 0;
    if (currentRate !== rate) {
      const start = performance.now();
      const delta = rate - currentRate;
      const step = now => {
        const progress = Math.min((now - start) / 500, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        rateEl.textContent = Math.round(currentRate + delta * eased) + '%';
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  // Your task panel updates via renderYourTask (defined below)
  if (typeof renderYourTask === 'function') renderYourTask();
}

// Notifications
let notifications = JSON.parse(localStorage.getItem('notifications') || 'null') || [
  { text: 'Welcome to BTB Dashboard', time: 'Just now', read: false },
  { text: 'Redocs task assigned to you', time: '2 hours ago', read: false },
  { text: '1760 Ventures weekly sync in 30 min', time: '3 hours ago', read: false },
  { text: 'Zapier workflow completed successfully', time: 'Yesterday', read: false },
  { text: 'New comment on your dashboard task', time: 'Yesterday', read: false },
  { text: 'Hazel shared a document with you', time: '2 days ago', read: true },
];

function saveNotifications() {
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  const unreadCount = notifications.filter(n => !n.read).length;

  badge.textContent = unreadCount;
  badge.style.display = unreadCount === 0 ? 'none' : 'block';

  list.innerHTML = '';

  if (notifications.length === 0) {
    list.innerHTML = '<li class="notif-empty">No notifications</li>';
    return;
  }

  notifications.forEach((n, i) => {
    const li = document.createElement('li');
    li.className = 'notif-item' + (n.read ? '' : ' unread');
    li.dataset.index = i;
    li.innerHTML = `
      <div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    `;
    list.appendChild(li);
  });
}

document.getElementById('notif-list').addEventListener('click', e => {
  const item = e.target.closest('.notif-item');
  if (!item) return;
  const i = item.dataset.index;
  notifications[i].read = true;
  saveNotifications();
  renderNotifications();
});

document.getElementById('mark-all-read').addEventListener('click', () => {
  notifications.forEach(n => n.read = true);
  saveNotifications();
  renderNotifications();
});

// Dropdown open/close
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
}

document.getElementById('notif-btn').addEventListener('click', e => {
  e.stopPropagation();
  const dd = document.getElementById('notif-dropdown');
  const isOpen = dd.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) dd.classList.add('open');
});

document.getElementById('settings-btn').addEventListener('click', e => {
  e.stopPropagation();
  const dd = document.getElementById('settings-dropdown');
  const isOpen = dd.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) dd.classList.add('open');
});

document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrap')) closeAllDropdowns();
});

// Settings
const darkToggle = document.getElementById('dark-toggle');
const compactToggle = document.getElementById('compact-toggle');

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  darkToggle.checked = true;
}

if (localStorage.getItem('compact') === 'true') {
  document.body.classList.add('compact');
  compactToggle.checked = true;
}

darkToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark', darkToggle.checked);
  localStorage.setItem('theme', darkToggle.checked ? 'dark' : 'light');
});

compactToggle.addEventListener('change', () => {
  document.body.classList.toggle('compact', compactToggle.checked);
  localStorage.setItem('compact', compactToggle.checked ? 'true' : 'false');
});

document.getElementById('export-data').addEventListener('click', () => {
  const data = {
    tasks,
    notes: localStorage.getItem('notes') || '',
    notifications,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `btb-dashboard-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('reset-data').addEventListener('click', () => {
  if (!confirm('Clear all tasks, notifications, and notes? This cannot be undone.')) return;
  tasks = [];
  notifications = [];
  localStorage.removeItem('tasks');
  localStorage.removeItem('notifications');
  localStorage.removeItem('notes');
  renderTasks();
  renderNotifications();
  updateAll();
  closeAllDropdowns();
});

renderNotifications();

// Search
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Search uses the dynamic clients array

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<span class="search-match">$1</span>');
}

function runSearch(query) {
  query = query.trim().toLowerCase();

  if (!query) {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
    return;
  }

  const taskHits = tasks
    .map((t, i) => ({ ...t, i }))
    .filter(t => t.text.toLowerCase().includes(query));

  const clientHits = clients.filter(c =>
    c.name.toLowerCase().includes(query) || (c.code && c.code.toLowerCase().includes(query))
  );

  const notifHits = notifications.filter(n => n.text.toLowerCase().includes(query));

  const total = taskHits.length + clientHits.length + notifHits.length;

  searchResults.innerHTML = '';

  if (total === 0) {
    searchResults.innerHTML = '<div class="search-empty">No results for "' + query + '"</div>';
    searchResults.classList.add('open');
    return;
  }

  if (taskHits.length) {
    const group = document.createElement('div');
    group.className = 'search-group';
    group.innerHTML = `<div class="search-group-title">Tasks (${taskHits.length})</div>`;
    taskHits.forEach(t => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div class="search-item-icon">☰</div>
        <div class="search-item-text">
          <div>${highlight(t.text, query)}</div>
          <div class="search-item-sub">${t.status.toUpperCase()}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        document.querySelector('[data-page="tasks"]').click();
        // Apply the task's own status as filter so it's visible
        setTaskFilterChip(t.status);
        closeSearch();
        // Scroll the matching task into view and flash it
        setTimeout(() => highlightTaskByText(t.text), 100);
      });
      group.appendChild(item);
    });
    searchResults.appendChild(group);
  }

  if (clientHits.length) {
    const group = document.createElement('div');
    group.className = 'search-group';
    group.innerHTML = `<div class="search-group-title">Clients (${clientHits.length})</div>`;
    clientHits.forEach(c => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div class="search-item-icon">◈</div>
        <div class="search-item-text">
          <div>${highlight(c.name, query)}</div>
          <div class="search-item-sub">${c.code ? 'Project ' + c.code : 'No project code'}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        document.querySelector('[data-page="clients"]').click();
        const card = document.querySelector(`.client-card[data-client="${c.name}"]`);
        if (card) card.click();
        closeSearch();
      });
      group.appendChild(item);
    });
    searchResults.appendChild(group);
  }

  if (notifHits.length) {
    const group = document.createElement('div');
    group.className = 'search-group';
    group.innerHTML = `<div class="search-group-title">Notifications (${notifHits.length})</div>`;
    notifHits.forEach(n => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div class="search-item-icon">🔔</div>
        <div class="search-item-text">
          <div>${highlight(n.text, query)}</div>
          <div class="search-item-sub">${n.time}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        document.getElementById('notif-btn').click();
        closeSearch();
      });
      group.appendChild(item);
    });
    searchResults.appendChild(group);
  }

  searchResults.classList.add('open');
}

function closeSearch() {
  searchResults.classList.remove('open');
  searchInput.value = '';
}

searchInput.addEventListener('input', e => runSearch(e.target.value));

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchInput.blur();
    closeSearch();
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search')) searchResults.classList.remove('open');
});

// Calendar + Reminders
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let reminders = JSON.parse(localStorage.getItem('reminders') || '{}');
let viewYear, viewMonth;

// Migrate old string-based reminders to objects { text, time, fired }
Object.keys(reminders).forEach(date => {
  reminders[date] = reminders[date].map(r => {
    if (typeof r === 'string') return { text: r, time: null, fired: false };
    return r;
  });
});

function saveReminders() {
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildCalendar(year, month) {
  const grid = document.getElementById('cal-grid');
  const monthLabel = document.getElementById('cal-month');
  grid.innerHTML = '';
  monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  days.forEach(d => {
    const c = document.createElement('div');
    c.className = 'cal-cell header';
    c.textContent = d;
    grid.appendChild(c);
  });

  const now = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const c = document.createElement('div');
    c.className = 'cal-cell day';
    c.textContent = d;
    c.dataset.date = dateKey(year, month, d);

    if (year === now.getFullYear() && month === now.getMonth() && d === now.getDate()) {
      c.classList.add('today');
    }

    if (reminders[c.dataset.date] && reminders[c.dataset.date].length) {
      c.classList.add('has-reminder');
    }

    c.addEventListener('click', () => openReminderModal(c.dataset.date));
    c.addEventListener('mouseenter', e => showTooltip(c, c.dataset.date));
    c.addEventListener('mouseleave', hideTooltip);
    grid.appendChild(c);
  }
}

// Reminder hover tooltip
const tooltip = document.getElementById('reminder-tooltip');

function showTooltip(cell, date) {
  const items = reminders[date] || [];
  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  if (items.length === 0) {
    tooltip.innerHTML = `
      <div class="tooltip-title">${label}</div>
      <div style="color: rgba(255,255,255,0.6); font-size: 11px;">No reminders</div>
      <div class="tooltip-hint">Click to add one</div>
    `;
  } else {
    const itemsHtml = items.map(r => {
      const timeStr = r.time ? `<strong style="color:#c4b5fd;">${r.time}</strong> — ` : '';
      return `<div class="tooltip-item">${timeStr}${r.text}</div>`;
    }).join('');
    tooltip.innerHTML = `
      <div class="tooltip-title">${label} — ${items.length} reminder${items.length > 1 ? 's' : ''}</div>
      ${itemsHtml}
      <div class="tooltip-hint">Click to edit</div>
    `;
  }

  const rect = cell.getBoundingClientRect();
  tooltip.classList.add('show');

  // Position after render so we know tooltip dimensions
  const ttRect = tooltip.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - ttRect.width / 2;
  let top = rect.top - ttRect.height - 10;

  // Keep within viewport
  const pad = 8;
  if (left < pad) left = pad;
  if (left + ttRect.width > window.innerWidth - pad) left = window.innerWidth - ttRect.width - pad;
  if (top < pad) top = rect.bottom + 10; // Flip below if no room above

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('show');
}

function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  buildCalendar(viewYear, viewMonth);
}

document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1));
document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1));

// Reminder modal
const reminderModal = document.getElementById('reminder-modal');
const reminderTitle = document.getElementById('reminder-date-title');
const reminderList = document.getElementById('reminder-list');
const reminderInput = document.getElementById('reminder-input');
const reminderAddBtn = document.getElementById('reminder-add-btn');
let currentReminderDate = null;

function formatDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

function openReminderModal(dateKey) {
  currentReminderDate = dateKey;
  reminderTitle.textContent = formatDate(dateKey);
  renderReminderList();
  reminderModal.classList.add('open');
  reminderInput.value = '';
  reminderInput.focus();
}

function closeReminderModal() {
  reminderModal.classList.remove('open');
  currentReminderDate = null;
  buildCalendar(viewYear, viewMonth);
  renderYourTask();
}

function renderReminderList() {
  const items = reminders[currentReminderDate] || [];
  reminderList.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'reminder-empty';
    empty.textContent = 'No reminders yet for this day.';
    reminderList.appendChild(empty);
    return;
  }

  // Sort: timed reminders first (by time), then untimed
  const sorted = items
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });

  sorted.forEach(r => {
    const li = document.createElement('li');
    li.className = 'reminder-item' + (r.fired ? ' reminder-fired' : '');
    const timeLabel = r.time ? `<span class="reminder-time-label">${r.time}</span>` : '';
    li.innerHTML = `<span>${timeLabel}${r.text}</span><button data-index="${r.i}">Delete</button>`;
    reminderList.appendChild(li);
  });
}

reminderList.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    const i = e.target.dataset.index;
    reminders[currentReminderDate].splice(i, 1);
    if (reminders[currentReminderDate].length === 0) delete reminders[currentReminderDate];
    saveReminders();
    renderReminderList();
  }
});

function addReminder() {
  const text = reminderInput.value.trim();
  const time = document.getElementById('reminder-time').value || null;
  if (!text || !currentReminderDate) return;
  if (!reminders[currentReminderDate]) reminders[currentReminderDate] = [];
  reminders[currentReminderDate].push({ text, time, fired: false });
  saveReminders();
  reminderInput.value = '';
  document.getElementById('reminder-time').value = '';
  renderReminderList();

  // Request notification permission on first timed reminder
  if (time && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

reminderAddBtn.addEventListener('click', addReminder);
reminderInput.addEventListener('keydown', e => { if (e.key === 'Enter') addReminder(); });

document.getElementById('reminder-close').addEventListener('click', closeReminderModal);
reminderModal.addEventListener('click', e => {
  if (e.target === reminderModal) closeReminderModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && reminderModal.classList.contains('open')) closeReminderModal();
});

// Your Task panel - show today's reminders if any, else active task
function renderYourTask() {
  const yt = document.getElementById('your-task-item');
  const now = new Date();
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const todayReminders = reminders[todayKey] || [];

  if (todayReminders.length > 0) {
    yt.innerHTML = `
      <div class="your-task-title">📌 ${todayReminders[0]}</div>
      <div class="your-task-sub">${todayReminders.length > 1 ? `+${todayReminders.length - 1} more reminder${todayReminders.length - 1 > 1 ? 's' : ''} today` : 'Reminder for today'}</div>
    `;
    return;
  }

  const active = tasks.find(t => t.status !== 'completed');
  if (active) {
    yt.innerHTML = `
      <div class="your-task-title">${active.text}</div>
      <div class="your-task-sub">${active.status.toUpperCase()}</div>
    `;
  } else {
    yt.innerHTML = `
      <div class="your-task-title">No active task</div>
      <div class="your-task-sub">Click a day on the calendar to set a reminder.</div>
    `;
  }
}

// Overall Progress page
function renderProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Top stats
  const rateEl = document.getElementById('prog-rate');
  const weekEl = document.getElementById('prog-week');
  const overdueEl = document.getElementById('prog-overdue');
  const activeClientsEl = document.getElementById('prog-active-clients');
  if (!rateEl) return; // Page elements not in DOM yet

  rateEl.textContent = total === 0 ? '0%' : Math.round((completed / total) * 100) + '%';

  const doneThisWeek = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    return t.created && new Date(t.created) >= weekAgo;
  }).length;
  weekEl.textContent = doneThisWeek;

  const overdueCount = tasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due + 'T00:00:00') < today).length;
  overdueEl.textContent = overdueCount;

  activeClientsEl.textContent = clients.filter(c => c.status === 'active').length;

  // Progress by client
  const byClient = document.getElementById('progress-by-client');
  byClient.innerHTML = '';

  if (clients.length === 0) {
    byClient.innerHTML = '<div class="progress-empty">No clients yet. Add some on the Clients page.</div>';
  } else {
    clients.forEach(c => {
      const clientTasks = tasks.filter(t => t.client === c.name);
      const doneTasks = clientTasks.filter(t => t.status === 'completed').length;
      const pct = clientTasks.length === 0 ? 0 : Math.round((doneTasks / clientTasks.length) * 100);
      const row = document.createElement('div');
      row.className = 'progress-client-row';
      row.innerHTML = `
        <div class="progress-client-name">
          ${c.name}
          <small>(${doneTasks}/${clientTasks.length})</small>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${pct === 100 ? 'complete' : ''}" style="width: ${pct}%;"></div>
        </div>
        <div class="progress-pct">${pct}%</div>
      `;
      byClient.appendChild(row);
    });
  }

  // Priority breakdown
  const priorityEl = document.getElementById('progress-priority');
  priorityEl.innerHTML = '';

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const high = activeTasks.filter(t => t.priority === 'high').length;
  const med = activeTasks.filter(t => t.priority === 'medium' || !t.priority).length;
  const low = activeTasks.filter(t => t.priority === 'low').length;
  const max = Math.max(high, med, low, 1);

  [
    { level: 'high', label: 'High', count: high },
    { level: 'medium', label: 'Medium', count: med },
    { level: 'low', label: 'Low', count: low },
  ].forEach(p => {
    const row = document.createElement('div');
    row.className = 'priority-row';
    row.innerHTML = `
      <span class="priority-dot ${p.level}"></span>
      <span class="priority-label">${p.label}</span>
      <div class="priority-bar">
        <div class="priority-bar-fill ${p.level}" style="width: ${(p.count / max) * 100}%;"></div>
      </div>
      <span class="priority-count">${p.count}</span>
    `;
    priorityEl.appendChild(row);
  });

  // Upcoming (next 7 days)
  const upcomingEl = document.getElementById('progress-upcoming');
  upcomingEl.innerHTML = '';

  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);

  const upcoming = tasks
    .filter(t => t.status !== 'completed' && t.due)
    .map(t => ({ ...t, dueDate: new Date(t.due + 'T00:00:00') }))
    .filter(t => t.dueDate >= today && t.dueDate <= sevenDays)
    .sort((a, b) => a.dueDate - b.dueDate);

  if (upcoming.length === 0) {
    upcomingEl.innerHTML = '<div class="progress-empty">No deadlines in the next 7 days.</div>';
  } else {
    upcoming.forEach(t => {
      const days = Math.round((t.dueDate - today) / 86400000);
      let label, cls = 'upcoming-date';
      if (days === 0) { label = 'Today'; cls += ' urgent'; }
      else if (days === 1) { label = 'Tomorrow'; cls += ' soon'; }
      else if (days <= 3) { label = `In ${days}d`; cls += ' soon'; }
      else { label = t.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

      const item = document.createElement('div');
      item.className = 'upcoming-item';
      item.innerHTML = `
        <span class="${cls}">${label}</span>
        <span class="upcoming-text">${t.text}</span>
        ${t.client ? `<span class="recent-client">◈ ${t.client}</span>` : ''}
      `;
      upcomingEl.appendChild(item);
    });
  }

  // Recently Completed (last 5)
  const recentEl = document.getElementById('progress-recent');
  recentEl.innerHTML = '';

  const recent = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .slice(0, 5);

  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="progress-empty">No completed tasks yet.</div>';
  } else {
    recent.forEach(t => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <span class="recent-checkmark">✓</span>
        <span class="recent-text">${t.text}</span>
        ${t.client ? `<span class="recent-client">◈ ${t.client}</span>` : ''}
      `;
      recentEl.appendChild(item);
    });
  }
}

// Month/Year picker
const monthBtn = document.getElementById('cal-month');
const monthPicker = document.getElementById('month-picker');
const monthSelect = document.getElementById('month-select');
const yearInput = document.getElementById('year-input');
const monthGoBtn = document.getElementById('month-picker-go');

MONTH_NAMES.forEach((name, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = name;
  monthSelect.appendChild(opt);
});

monthBtn.addEventListener('click', e => {
  e.stopPropagation();
  monthSelect.value = viewMonth;
  yearInput.value = viewYear;
  monthPicker.classList.toggle('open');
});

monthGoBtn.addEventListener('click', () => {
  const newMonth = parseInt(monthSelect.value, 10);
  const newYear = parseInt(yearInput.value, 10);
  if (!isNaN(newMonth) && !isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
    viewMonth = newMonth;
    viewYear = newYear;
    buildCalendar(viewYear, viewMonth);
  }
  monthPicker.classList.remove('open');
});

yearInput.addEventListener('keydown', e => { if (e.key === 'Enter') monthGoBtn.click(); });

document.addEventListener('click', e => {
  if (!e.target.closest('.cal-month-wrap')) monthPicker.classList.remove('open');
});

// Alarm system
const alarmOverlay = document.getElementById('alarm-overlay');
const alarmText = document.getElementById('alarm-text');
const alarmTimeEl = document.getElementById('alarm-time');
const alarmDismiss = document.getElementById('alarm-dismiss');

let alarmAudio = null;

function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const playBeep = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Three-tone alarm, repeated twice
    for (let rep = 0; rep < 2; rep++) {
      const base = rep * 0.9;
      playBeep(880, base, 0.15);
      playBeep(880, base + 0.2, 0.15);
      playBeep(1100, base + 0.4, 0.3);
    }
  } catch (err) {
    console.warn('Audio not supported', err);
  }
}

function triggerAlarm(reminder, date) {
  alarmText.textContent = reminder.text;
  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  alarmTimeEl.textContent = `${label} at ${reminder.time}`;
  alarmOverlay.classList.add('show');
  playAlarmSound();

  // Browser notification if allowed
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Reminder', {
      body: `${reminder.text} (${reminder.time})`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="78" font-size="90">⏰</text></svg>',
    });
  }
}

alarmDismiss.addEventListener('click', () => {
  alarmOverlay.classList.remove('show');
});

function checkAlarms() {
  const now = new Date();
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const items = reminders[todayKey] || [];
  items.forEach(r => {
    if (r.time && !r.fired && r.time === currentTime) {
      r.fired = true;
      saveReminders();
      triggerAlarm(r, todayKey);
    }
  });
}

// Check every 20 seconds
setInterval(checkAlarms, 20000);
// Also check once right away
checkAlarms();

// Init
const today = new Date();
viewYear = today.getFullYear();
viewMonth = today.getMonth();
buildCalendar(viewYear, viewMonth);
renderTasks();
renderClients();
saveClients();
updateAll();
renderYourTask();

// ============================================
// Advanced task filters + sort (client, priority, sort)
// ============================================
const taskClientFilter = document.getElementById('task-client-filter');
const taskPriorityFilter = document.getElementById('task-priority-filter');
const taskSort = document.getElementById('task-sort');

function populateClientFilter() {
  if (!taskClientFilter) return;
  const current = taskClientFilter.value;
  taskClientFilter.innerHTML = '<option value="all">All clients</option>';
  const names = [...new Set(clients.map(c => c.name).filter(Boolean))].sort();
  names.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    taskClientFilter.appendChild(opt);
  });
  if (names.includes(current) || current === 'all') taskClientFilter.value = current;
}

populateClientFilter();

if (taskClientFilter) {
  taskClientFilter.addEventListener('change', () => {
    currentClientFilter = taskClientFilter.value;
    renderTasks();
  });
}

if (taskPriorityFilter) {
  taskPriorityFilter.addEventListener('change', () => {
    currentPriorityFilter = taskPriorityFilter.value;
    renderTasks();
  });
}

if (taskSort) {
  taskSort.addEventListener('change', () => {
    currentSort = taskSort.value;
    renderTasks();
  });
}

// Repopulate client filter whenever clients change.
// Wraps saveClients if it exists, else hooks into localStorage.setItem for 'clients'.
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function (k, v) {
  _origSetItem(k, v);
  if (k === 'clients') populateClientFilter();
};

// ============================================
// Quick-add task on Overview
// ============================================
const quickAddInput = document.getElementById('quick-add-input');
const quickAddBtn = document.getElementById('quick-add-btn');

function quickAddTask() {
  const text = quickAddInput.value.trim();
  if (!text) {
    quickAddInput.classList.add('shake');
    setTimeout(() => quickAddInput.classList.remove('shake'), 400);
    quickAddInput.focus();
    return;
  }
  tasks.push({
    text,
    status: 'pending',
    priority: 'medium',
    due: '',
    client: '',
    notes: '',
    created: Date.now(),
  });
  saveTasks();
  renderTasks();
  quickAddInput.value = '';
  quickAddInput.classList.add('flash-ok');
  setTimeout(() => quickAddInput.classList.remove('flash-ok'), 600);
  quickAddInput.focus();
}

if (quickAddBtn) quickAddBtn.addEventListener('click', quickAddTask);
if (quickAddInput) {
  quickAddInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') quickAddTask();
  });
}

// ============================================
// Theme toggle button in header (syncs with settings dark toggle)
// ============================================
const themeToggleBtn = document.getElementById('theme-toggle-btn');

function syncThemeIcon() {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = document.body.classList.contains('dark') ? '☀' : '🌙';
}

syncThemeIcon();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const nowDark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
    if (darkToggle) darkToggle.checked = nowDark;
    syncThemeIcon();
  });
}

// Also sync icon when settings dark toggle is used
if (darkToggle) {
  darkToggle.addEventListener('change', syncThemeIcon);
}

// ============================================
// Client Drawer (slide-in detail view with tasks + progress)
// ============================================
const clientDrawer = document.getElementById('client-drawer');
const clientDrawerBackdrop = document.getElementById('client-drawer-backdrop');
const drawerClientName = document.getElementById('drawer-client-name');
const drawerBody = document.getElementById('drawer-body');
const drawerClose = document.getElementById('drawer-close');

function openClientDrawer(client) {
  const clientTasks = tasks.filter(t => t.client === client.name);
  const total = clientTasks.length;
  const done = clientTasks.filter(t => t.status === 'completed').length;
  const pending = clientTasks.filter(t => t.status === 'pending').length;
  const ongoing = clientTasks.filter(t => t.status === 'ongoing').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskListHtml = clientTasks.length
    ? clientTasks.map(t => {
        let badge = '';
        if (t.due && t.status !== 'completed') {
          const d = new Date(t.due + 'T00:00:00');
          const diff = Math.round((d - today) / 86400000);
          if (diff < 0) badge = '<span class="drawer-badge red">OVERDUE</span>';
          else if (diff === 0) badge = '<span class="drawer-badge orange">TODAY</span>';
        }
        const doneClass = t.status === 'completed' ? 'drawer-task done' : 'drawer-task';
        return `<li class="${doneClass}"><span class="drawer-status ${t.status}">${t.status}</span><span class="drawer-task-text">${t.text}</span>${badge}</li>`;
      }).join('')
    : '<li class="drawer-empty">No tasks assigned to this client yet.</li>';

  drawerClientName.textContent = client.name;
  drawerBody.innerHTML = `
    <div class="drawer-meta">
      <span class="client-status ${client.status || 'active'}">${client.status || 'active'}</span>
      <span class="drawer-chip">Priority: ${client.priority || 'medium'}</span>
      ${client.code ? `<span class="drawer-chip">${client.code}</span>` : ''}
    </div>

    <div class="drawer-section">
      <h4>Progress</h4>
      <div class="drawer-progress">
        <div class="drawer-progress-bar"><div class="drawer-progress-fill" style="width:${pct}%"></div></div>
        <div class="drawer-progress-label">${done}/${total} tasks completed · ${pct}%</div>
      </div>
      <div class="drawer-stat-row">
        <div class="drawer-stat"><span class="drawer-stat-num">${pending}</span><span class="drawer-stat-lbl">Pending</span></div>
        <div class="drawer-stat"><span class="drawer-stat-num">${ongoing}</span><span class="drawer-stat-lbl">Ongoing</span></div>
        <div class="drawer-stat"><span class="drawer-stat-num">${done}</span><span class="drawer-stat-lbl">Done</span></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Tasks (${total})</h4>
      <ul class="drawer-task-list">${taskListHtml}</ul>
    </div>

    <div class="drawer-section">
      <h4>Contact</h4>
      <div class="drawer-kv"><span>Name</span><span>${client.contact || '—'}</span></div>
      <div class="drawer-kv"><span>Email</span><span>${client.email ? `<a href="mailto:${client.email}">${client.email}</a>` : '—'}</span></div>
      <div class="drawer-kv"><span>Start date</span><span>${client.start ? new Date(client.start + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div>
    </div>

    ${client.notes ? `
    <div class="drawer-section">
      <h4>Notes</h4>
      <p class="drawer-notes">${client.notes}</p>
    </div>` : ''}
  `;

  clientDrawer.classList.remove('hidden');
  clientDrawerBackdrop.classList.remove('hidden');
  requestAnimationFrame(() => {
    clientDrawer.classList.add('open');
    clientDrawerBackdrop.classList.add('open');
  });
}

function closeClientDrawer() {
  clientDrawer.classList.remove('open');
  clientDrawerBackdrop.classList.remove('open');
  setTimeout(() => {
    clientDrawer.classList.add('hidden');
    clientDrawerBackdrop.classList.add('hidden');
  }, 300);
}

if (drawerClose) drawerClose.addEventListener('click', closeClientDrawer);
if (clientDrawerBackdrop) clientDrawerBackdrop.addEventListener('click', closeClientDrawer);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !clientDrawer.classList.contains('hidden')) closeClientDrawer();
});

// Open drawer when a client card is clicked
clientGrid.addEventListener('click', e => {
  if (e.target.closest('.client-delete')) return;
  const card = e.target.closest('.client-card.clickable');
  if (!card) return;
  const i = parseInt(card.dataset.index, 10);
  if (isNaN(i) || !clients[i]) return;
  openClientDrawer(clients[i]);
});

// ============================================
// Task drag-to-reorder
// ============================================
let dragSourceIndex = null;

taskList.addEventListener('dragstart', e => {
  const li = e.target.closest('.task-item');
  if (!li || li.classList.contains('done')) return;
  dragSourceIndex = parseInt(li.dataset.index, 10);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragSourceIndex));
});

taskList.addEventListener('dragend', e => {
  const li = e.target.closest('.task-item');
  if (li) li.classList.remove('dragging');
  document.querySelectorAll('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragSourceIndex = null;
});

taskList.addEventListener('dragover', e => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const li = e.target.closest('.task-item');
  if (!li || li.classList.contains('done')) return;
  document.querySelectorAll('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  li.classList.add('drag-over');
});

taskList.addEventListener('dragleave', e => {
  const li = e.target.closest('.task-item');
  if (li) li.classList.remove('drag-over');
});

taskList.addEventListener('drop', e => {
  e.preventDefault();
  const targetLi = e.target.closest('.task-item');
  if (!targetLi) return;
  const targetIndex = parseInt(targetLi.dataset.index, 10);
  if (dragSourceIndex === null || dragSourceIndex === targetIndex) return;

  // Reorder the tasks array
  const [moved] = tasks.splice(dragSourceIndex, 1);
  tasks.splice(targetIndex, 0, moved);

  // Switch sort to custom order so drag order is respected
  currentSort = 'created-desc';
  if (taskSort) {
    // Add a "Custom (drag order)" option if not present
    if (!taskSort.querySelector('option[value="custom"]')) {
      const opt = document.createElement('option');
      opt.value = 'custom';
      opt.textContent = 'Custom (drag order)';
      taskSort.appendChild(opt);
    }
    taskSort.value = 'custom';
    currentSort = 'custom';
  }

  saveTasks();
  renderTasks();
});

// ============================================
// Skeleton loader on initial dashboard mount
// ============================================
(function showInitialSkeleton() {
  const overview = document.getElementById('overview');
  if (!overview) return;
  const skeleton = document.createElement('div');
  skeleton.id = 'initial-skeleton';
  skeleton.innerHTML = `
    <div class="skel-welcome">
      <div class="skel-line w-40"></div>
      <div class="skel-line w-70 lg"></div>
      <div class="skel-line w-55"></div>
      <div class="skel-line w-30"></div>
    </div>
    <div class="skel-row">
      <div class="skel-card"></div>
      <div class="skel-card"></div>
      <div class="skel-card"></div>
    </div>
    <div class="skel-row">
      <div class="skel-card sm"></div>
      <div class="skel-card sm"></div>
      <div class="skel-card sm"></div>
      <div class="skel-card sm"></div>
    </div>
    <div class="skel-row">
      <div class="skel-card tall"></div>
      <div class="skel-card tall"></div>
    </div>
  `;
  document.body.appendChild(skeleton);

  // Remove skeleton after short delay + fade out
  setTimeout(() => {
    skeleton.classList.add('fade-out');
    setTimeout(() => {
      skeleton.remove();
      // Kick off the bar chart animation after skeleton fades
      replayBarChartAnimation();
    }, 300);
  }, 650);
})();

// ============================================
// Animate progress ring on updates
// ============================================
(function enhanceRingAnimation() {
  const ring = document.querySelector('.progress-ring');
  if (!ring) return;
  ring.style.transition = 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
})();

// ============================================
// Sound Engine (Web Audio API - no files needed)
// ============================================
const SoundEngine = (() => {
  let audioCtx = null;
  let enabled = localStorage.getItem('sound_enabled') === 'true';

  function ensureContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone({ freq = 600, type = 'sine', duration = 0.08, gain = 0.15, attack = 0.005, release = 0.04, delay = 0 } = {}) {
    const ctx = ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.linearRampToValueAtTime(0, now + duration + release);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + release + 0.02);
  }

  return {
    isEnabled: () => enabled,
    setEnabled(v) {
      enabled = !!v;
      localStorage.setItem('sound_enabled', enabled ? 'true' : 'false');
    },
    click() {
      if (!enabled) return;
      tone({ freq: 880, type: 'sine', duration: 0.03, gain: 0.08 });
    },
    pop() {
      if (!enabled) return;
      tone({ freq: 520, type: 'triangle', duration: 0.05, gain: 0.12 });
      tone({ freq: 780, type: 'triangle', duration: 0.06, gain: 0.1, delay: 0.03 });
    },
    success() {
      if (!enabled) return;
      // C5 -> E5 -> G5 ascending chime
      tone({ freq: 523, type: 'sine', duration: 0.1, gain: 0.14 });
      tone({ freq: 659, type: 'sine', duration: 0.1, gain: 0.14, delay: 0.08 });
      tone({ freq: 784, type: 'sine', duration: 0.18, gain: 0.14, delay: 0.16 });
    },
    error() {
      if (!enabled) return;
      tone({ freq: 220, type: 'sawtooth', duration: 0.08, gain: 0.12 });
      tone({ freq: 180, type: 'sawtooth', duration: 0.12, gain: 0.12, delay: 0.07 });
    },
    thunk() {
      if (!enabled) return;
      tone({ freq: 140, type: 'sine', duration: 0.09, gain: 0.15 });
    },
  };
})();

// Sound toggle wiring
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.checked = SoundEngine.isEnabled();
  soundToggle.addEventListener('change', () => {
    SoundEngine.setEnabled(soundToggle.checked);
    if (soundToggle.checked) SoundEngine.success(); // confirm sound
  });
}

// Wire sound effects to actions
// Generic button clicks (avoid double-binding on inputs)
document.addEventListener('click', e => {
  const t = e.target;
  if (t.tagName === 'BUTTON' && !t.closest('.task-item') && !t.closest('.client-card')) {
    SoundEngine.click();
  }
});

// Task event sounds via task-count watcher + action detection.
// We avoid monkey-patching function declarations since event listeners capture
// the original reference. Instead, watch for state changes after the fact.

let _soundPrevTaskCount = tasks.length;
let _soundPrevCompletedCount = tasks.filter(t => t.status === 'completed').length;

function _soundWatchTaskChanges() {
  const newCount = tasks.length;
  const newCompletedCount = tasks.filter(t => t.status === 'completed').length;

  if (newCount > _soundPrevTaskCount) {
    SoundEngine.pop(); // task added
  } else if (newCount < _soundPrevTaskCount) {
    SoundEngine.thunk(); // task deleted
  } else if (newCompletedCount > _soundPrevCompletedCount) {
    SoundEngine.success(); // task completed
  } else if (newCompletedCount < _soundPrevCompletedCount) {
    SoundEngine.click(); // task uncompleted (subtle)
  }

  _soundPrevTaskCount = newCount;
  _soundPrevCompletedCount = newCompletedCount;
}

// Hook into clicks that trigger task mutations.
// We run after the handler via microtask - by then the task array is updated.
['click', 'keydown'].forEach(evt => {
  taskList.addEventListener(evt, () => queueMicrotask(_soundWatchTaskChanges), true);
});

if (addTaskBtn) addTaskBtn.addEventListener('click', () => queueMicrotask(_soundWatchTaskChanges));
if (newTaskInput) newTaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') queueMicrotask(_soundWatchTaskChanges);
});
if (quickAddBtn) quickAddBtn.addEventListener('click', () => queueMicrotask(_soundWatchTaskChanges));
if (quickAddInput) quickAddInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') queueMicrotask(_soundWatchTaskChanges);
});

// ============================================
// Avatar Upload & Picker
// ============================================
const userAvatar = document.getElementById('user-avatar');
const avatarImg = document.getElementById('avatar-img');
const avatarModal = document.getElementById('avatar-modal');
const avatarModalBackdrop = document.getElementById('avatar-modal-backdrop');
const avatarModalClose = document.getElementById('avatar-modal-close');
const avatarUpload = document.getElementById('avatar-upload');
const avatarUploadBtn = document.getElementById('avatar-upload-btn');
const avatarPreview = document.getElementById('avatar-preview');
const avatarPreviewLabel = document.getElementById('avatar-preview-label');
const avatarPresetsEl = document.getElementById('avatar-presets');
const avatarInitialColorsEl = document.getElementById('avatar-initial-colors');
const avatarResetBtn = document.getElementById('avatar-reset');

const INITIAL_COLORS = [
  { name: 'purple', from: '#8b5cf6', to: '#6366f1' },
  { name: 'pink', from: '#ec4899', to: '#f43f5e' },
  { name: 'orange', from: '#f97316', to: '#f59e0b' },
  { name: 'teal', from: '#14b8a6', to: '#06b6d4' },
  { name: 'green', from: '#10b981', to: '#84cc16' },
  { name: 'blue', from: '#3b82f6', to: '#6366f1' },
];

function getUserInitials() {
  const name = localStorage.getItem('btb_username') || 'admin';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function initialsSvgDataUri(color, initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color.from}"/><stop offset="100%" stop-color="${color.to}"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#g)"/><text x="50" y="62" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="42" fill="white">${initials}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function emojiSvgDataUri(emoji, bgColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${bgColor}"/><text x="50" y="70" text-anchor="middle" font-size="58">${emoji}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const EMOJI_PRESETS = [
  { emoji: '🚀', bg: '#ede9fe' },
  { emoji: '🔥', bg: '#fee2e2' },
  { emoji: '⚡', bg: '#fef3c7' },
  { emoji: '🌱', bg: '#d1fae5' },
  { emoji: '🎯', bg: '#dbeafe' },
  { emoji: '💎', bg: '#e0f2fe' },
  { emoji: '🦁', bg: '#ffedd5' },
  { emoji: '🌙', bg: '#f3e8ff' },
];

function applyAvatarFromStorage() {
  const saved = localStorage.getItem('btb_avatar');
  if (saved) {
    avatarImg.src = saved;
  } else {
    avatarImg.src = 'logo.png';
  }
}

function setAvatar(src) {
  avatarImg.src = src;
  if (src === 'logo.png') {
    localStorage.removeItem('btb_avatar');
  } else {
    localStorage.setItem('btb_avatar', src);
  }
  updatePreview();
}

function updatePreview() {
  const current = localStorage.getItem('btb_avatar') || 'logo.png';
  avatarPreview.innerHTML = `<img src="${current}" alt="preview" />`;
}

function renderEmojiPresets() {
  avatarPresetsEl.innerHTML = '';
  EMOJI_PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'avatar-preset-btn';
    btn.innerHTML = `<img src="${emojiSvgDataUri(p.emoji, p.bg)}" alt="${p.emoji}" />`;
    btn.addEventListener('click', () => setAvatar(emojiSvgDataUri(p.emoji, p.bg)));
    avatarPresetsEl.appendChild(btn);
  });
}

function renderInitialColors() {
  avatarInitialColorsEl.innerHTML = '';
  const initials = getUserInitials();
  INITIAL_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'avatar-preset-btn';
    btn.innerHTML = `<img src="${initialsSvgDataUri(c, initials)}" alt="${c.name}" />`;
    btn.addEventListener('click', () => setAvatar(initialsSvgDataUri(c, initials)));
    avatarInitialColorsEl.appendChild(btn);
  });
}

function openAvatarModal() {
  renderEmojiPresets();
  renderInitialColors();
  updatePreview();
  avatarModal.classList.remove('hidden');
  avatarModalBackdrop.classList.remove('hidden');
  requestAnimationFrame(() => {
    avatarModal.classList.add('open');
    avatarModalBackdrop.classList.add('open');
  });
}

function closeAvatarModal() {
  avatarModal.classList.remove('open');
  avatarModalBackdrop.classList.remove('open');
  setTimeout(() => {
    avatarModal.classList.add('hidden');
    avatarModalBackdrop.classList.add('hidden');
  }, 250);
}

if (userAvatar) userAvatar.addEventListener('click', openAvatarModal);
if (avatarModalClose) avatarModalClose.addEventListener('click', closeAvatarModal);
if (avatarModalBackdrop) avatarModalBackdrop.addEventListener('click', closeAvatarModal);
if (avatarResetBtn) avatarResetBtn.addEventListener('click', () => setAvatar('logo.png'));

if (avatarUploadBtn) {
  avatarUploadBtn.addEventListener('click', () => avatarUpload.click());
}

if (avatarUpload) {
  avatarUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large - please pick one under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !avatarModal.classList.contains('hidden')) closeAvatarModal();
});

applyAvatarFromStorage();

// ============================================
// Streak counter + Daily goal
// ============================================
function todayKeyStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function recordCompletionForStreak() {
  const today = todayKeyStr();
  const completedDays = JSON.parse(localStorage.getItem('completed_days') || '[]');
  if (!completedDays.includes(today)) {
    completedDays.push(today);
    localStorage.setItem('completed_days', JSON.stringify(completedDays));
  }
  updateStreakDisplay();
}

function calcStreak() {
  const completedDays = JSON.parse(localStorage.getItem('completed_days') || '[]');
  if (completedDays.length === 0) return 0;
  const sorted = [...completedDays].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  // If no completion today, start counting from yesterday (so streak doesn't break mid-day)
  const todayStr = todayKeyStr();
  if (!sorted.includes(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (sorted.includes(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function updateStreakDisplay() {
  const streak = calcStreak();
  const el = document.getElementById('streak-num');
  const card = document.getElementById('streak-card');
  if (el) el.textContent = streak;
  if (card) {
    card.classList.toggle('streak-active', streak > 0);
    card.classList.toggle('streak-hot', streak >= 7);
  }
}

function getDailyGoal() {
  return parseInt(localStorage.getItem('daily_goal') || '5', 10);
}

function getTodayCompletionCount() {
  // Count tasks completed today (based on completed_at timestamp)
  const today = todayKeyStr();
  return tasks.filter(t => t.status === 'completed' && t.completed_at === today).length;
}

function updateDailyGoalDisplay() {
  const goal = getDailyGoal();
  const done = getTodayCompletionCount();
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const fill = document.getElementById('goal-progress-fill');
  const stats = document.getElementById('goal-stats');
  if (fill) fill.style.width = pct + '%';
  if (stats) {
    stats.textContent = done >= goal ? `${done} / ${goal} tasks · Goal hit! 🎉` : `${done} / ${goal} tasks`;
  }
  if (fill) fill.classList.toggle('goal-complete', done >= goal);
}

const goalEditBtn = document.getElementById('goal-edit');
if (goalEditBtn) {
  goalEditBtn.addEventListener('click', () => {
    const current = getDailyGoal();
    const next = prompt('Set your daily task goal:', String(current));
    const n = parseInt(next, 10);
    if (!isNaN(n) && n > 0 && n <= 50) {
      localStorage.setItem('daily_goal', String(n));
      updateDailyGoalDisplay();
    }
  });
}

// Stamp completion timestamps on tasks so we can count per-day
function stampTaskCompletions() {
  let dirty = false;
  tasks.forEach(t => {
    if (t.status === 'completed' && !t.completed_at) {
      t.completed_at = todayKeyStr();
      dirty = true;
    }
  });
  if (dirty) saveTasks();
}
stampTaskCompletions();

// Hook into task status changes - add completed_at timestamp when marked complete
const _origSaveTasks = saveTasks;
saveTasks = function () {
  const today = todayKeyStr();
  tasks.forEach(t => {
    if (t.status === 'completed' && !t.completed_at) t.completed_at = today;
    if (t.status !== 'completed' && t.completed_at) delete t.completed_at;
  });
  _origSaveTasks();
};

// ============================================
// Confetti + Task Completion Celebration
// ============================================
function fireConfetti(x, y, count = 40) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#f59e0b'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = x + 'px';
    piece.style.top = y + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const velocity = 120 + Math.random() * 200;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 150; // upward bias
    const rot = (Math.random() - 0.5) * 720;
    piece.style.setProperty('--vx', vx + 'px');
    piece.style.setProperty('--vy', vy + 'px');
    piece.style.setProperty('--rot', rot + 'deg');
    piece.style.animationDelay = (Math.random() * 0.1) + 's';
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 2000);
}

// Hook into task completion: detect when a task becomes completed and fire confetti + record streak
let _celebPrevCompleted = tasks.filter(t => t.status === 'completed').length;

function _checkCompletionCelebration(originEl) {
  const nowCompleted = tasks.filter(t => t.status === 'completed').length;
  if (nowCompleted > _celebPrevCompleted) {
    // Confetti origin: the clicked element, or center of screen
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    fireConfetti(x, y, 50);
    recordCompletionForStreak();

    // Check if daily goal just hit
    const done = getTodayCompletionCount();
    const goal = getDailyGoal();
    if (done === goal) {
      setTimeout(() => fireConfetti(window.innerWidth / 2, window.innerHeight / 3, 120), 400);
    }

    updateDailyGoalDisplay();
  } else if (nowCompleted < _celebPrevCompleted) {
    updateDailyGoalDisplay();
  }
  _celebPrevCompleted = nowCompleted;
}

taskList.addEventListener('click', e => {
  queueMicrotask(() => _checkCompletionCelebration(e.target));
}, true);

// Initial render
updateStreakDisplay();
updateDailyGoalDisplay();

// Keep daily goal display fresh as tasks change
const _origRenderTasks = renderTasks;
renderTasks = function () {
  _origRenderTasks();
  updateDailyGoalDisplay();
  updateStreakDisplay();
};

// ============================================
// Time-of-day theming
// ============================================
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function applyTimeOfDayTheme() {
  const tod = getTimeOfDay();
  document.body.classList.remove('tod-morning', 'tod-day', 'tod-evening', 'tod-night');
  document.body.classList.add('tod-' + tod);
}

applyTimeOfDayTheme();
setInterval(applyTimeOfDayTheme, 5 * 60 * 1000); // re-check every 5 min

// ============================================
// Weekly Recap Card
// Shows last week's completed count at start of each week.
// Dismissable; remembers dismissal per ISO week.
// ============================================
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

function getLastWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun
  const daysSinceMonday = (day + 6) % 7; // Mon = 0
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysSinceMonday);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  return { lastMonday, lastSunday };
}

function countTasksCompletedLastWeek() {
  const { lastMonday, lastSunday } = getLastWeekRange();
  const mondayKey = `${lastMonday.getFullYear()}-${String(lastMonday.getMonth() + 1).padStart(2, '0')}-${String(lastMonday.getDate()).padStart(2, '0')}`;
  const sundayKey = `${lastSunday.getFullYear()}-${String(lastSunday.getMonth() + 1).padStart(2, '0')}-${String(lastSunday.getDate()).padStart(2, '0')}`;
  return tasks.filter(t => {
    if (!t.completed_at || t.status !== 'completed') return false;
    return t.completed_at >= mondayKey && t.completed_at <= sundayKey;
  }).length;
}

function renderWeeklyRecap() {
  const card = document.getElementById('weekly-recap');
  if (!card) return;

  const currentWeek = getISOWeek(new Date());
  const dismissedWeek = localStorage.getItem('recap_dismissed_week');
  if (dismissedWeek === currentWeek) {
    card.classList.add('hidden');
    return;
  }

  const count = countTasksCompletedLastWeek();
  const { lastMonday, lastSunday } = getLastWeekRange();
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const msg = document.getElementById('recap-msg');
  const title = document.getElementById('recap-title');
  if (title) title.textContent = `Last week's recap · ${fmt(lastMonday)} – ${fmt(lastSunday)}`;

  let message;
  if (count === 0) {
    message = 'No tasks completed last week. Fresh slate this week - let\'s build some momentum.';
  } else if (count === 1) {
    message = 'You completed <strong>1 task</strong> last week. Small wins compound.';
  } else if (count < 5) {
    message = `You completed <strong>${count} tasks</strong> last week. Solid start.`;
  } else if (count < 10) {
    message = `You completed <strong>${count} tasks</strong> last week. That's a real week of work.`;
  } else if (count < 20) {
    message = `<strong>${count} tasks</strong> done last week. That's pace. Keep it up.`;
  } else {
    message = `<strong>${count} tasks</strong> last week. 🔥 You were locked in.`;
  }
  if (msg) msg.innerHTML = message;

  card.classList.remove('hidden');
}

const recapClose = document.getElementById('recap-close');
if (recapClose) {
  recapClose.addEventListener('click', () => {
    const currentWeek = getISOWeek(new Date());
    localStorage.setItem('recap_dismissed_week', currentWeek);
    document.getElementById('weekly-recap').classList.add('hidden');
  });
}

renderWeeklyRecap();
