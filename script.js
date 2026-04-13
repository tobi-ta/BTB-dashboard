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
    document.getElementById(target).classList.remove('hidden');
  });
});

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
  if (hour < 5) return 'Working late, Team?';
  if (hour < 12) return 'Good morning, Team';
  if (hour < 17) return 'Good afternoon, Team';
  if (hour < 21) return 'Good evening, Team';
  return 'Burning the midnight oil, Team?';
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
    visible = tasks;
  } else if (currentFilter === 'overdue') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    visible = tasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due + 'T00:00:00') < today);
  } else {
    visible = tasks.filter(t => t.status === currentFilter);
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
    li.className = 'task-item' + (task.status === 'completed' ? ' done' : '');
    li.dataset.index = realIndex;

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
          dueLabel = `Overdue · ${dueLabel}`;
        } else if (diffDays === 0) {
          chipClass += ' due-soon';
          dueLabel = `Due today`;
        } else if (diffDays <= 2) {
          chipClass += ' due-soon';
          dueLabel = `Due in ${diffDays}d`;
        } else {
          dueLabel = `Due ${dueLabel}`;
        }
      } else {
        dueLabel = `Was due ${dueLabel}`;
      }
      meta.push(`<span class="${chipClass}">📅 ${dueLabel}</span>`);
    }

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
