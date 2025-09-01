// ==============================
// Task Dashboard JavaScript
// ==============================
class TaskManager {
  constructor() {
    this.tasks = [];
    this.init();
  }

  init() {
    this.loadTasksFromDOM();
    this.updateProgressBar();
    this.updateAllStats();
    this.setupEventListeners();
    this.sortTasksByPriority();
    this.handleEmptyState();
  }

  // ------------------------------
  // Load existing tasks
  // ------------------------------
  loadTasksFromDOM() {
    const taskItems = document.querySelectorAll('.task-item:not(.empty-state)');
    this.tasks = Array.from(taskItems).map(item => ({
      id: item.dataset.taskId,
      title: item.querySelector('.task-title').textContent.trim(),
      priority: item.dataset.priority,
      completed: item.classList.contains('completed'),
      element: item
    }));
  }

  // ------------------------------
  // Progress + Stats
  // ------------------------------
  updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar && progressText) {
      const completionRate = this.getCompletionRate();
      progressBar.style.width = `${completionRate}%`;
      progressBar.setAttribute('data-completion', completionRate);
      progressText.textContent = `${completionRate}% Complete`;
    }
  }

  getCompletionRate() {
    if (this.tasks.length === 0) return 0;
    const completed = this.tasks.filter(task => task.completed).length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  updateAllStats() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = this.getCompletionRate();
    const highPriorityCount = this.tasks.filter(task => task.priority === 'high').length;
    const latestTask = this.getLatestTask();

    this.updateStatElement('totalTasks', totalTasks);
    this.updateStatElement('completedTasks', completedTasks);
    this.updateStatElement('pendingTasks', pendingTasks);
    this.updateStatElement('completionRate', `${completionRate}% of tasks completed`);
    this.updateStatElement('highPriorityCount', `${highPriorityCount} tasks`);
    this.updateStatElement('latestTask', latestTask);
  }

  updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  getLatestTask() {
    if (this.tasks.length === 0) return 'No tasks yet';
    return this.tasks[this.tasks.length - 1].title;
  }

  // ------------------------------
  // Events & Actions
  // ------------------------------
  setupEventListeners() {
    this.setupFormSubmission();
    this.setupTaskActions();
    this.setupDragAndDrop();
    this.setupMobileToggle();
  }

  setupFormSubmission() {
    const form = document.getElementById('addTaskForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const title = formData.get('title');
      const priority = formData.get('priority').toLowerCase();

      if (title.trim()) {
        this.addTask(title.trim(), priority);
        form.reset();
      }
    });
  }

  addTask(title, priority) {
    const taskId = 'temp_' + Date.now();
    const task = {
      id: taskId,
      title,
      priority,
      completed: false,
      element: null
    };

    const taskElement = this.createTaskElement(task);
    task.element = taskElement;
    this.tasks.push(task);

    const taskList = document.getElementById('taskList');
    taskList.appendChild(taskElement);

    this.updateAllStats();
    this.updateProgressBar();
    this.sortTasksByPriority();
    this.handleEmptyState();

    this.animateTaskIn(taskElement);
  }

  createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.taskId = task.id;
    li.dataset.priority = task.priority;

    li.innerHTML = `
      <span class="priority-circle priority-${task.priority}"></span>
      <span class="task-title">${task.title}</span>
      <div class="task-actions">
        <button type="button" class="btn btn-check">✔</button>
        <button type="button" class="btn btn-giveup">🚫</button>
      </div>
    `;
    return li;
  }

  setupTaskActions() {
    document.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem || taskItem.classList.contains('empty-state')) return;

      const taskId = taskItem.dataset.taskId;

      if (e.target.classList.contains('btn-check')) {
        e.preventDefault();
        this.toggleTaskCompletion(taskId);
      } else if (e.target.classList.contains('btn-giveup')) {
        e.preventDefault();
        this.deleteTask(taskId);
      }
    });
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.element.classList.toggle('completed', task.completed);

    this.updateAllStats();
    this.updateProgressBar();
    this.sortTasksByPriority();
    this.animateTaskAction(task.element);
  }

  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.tasks[taskIndex];
    this.animateTaskOut(task.element, () => {
      task.element.remove();
      this.tasks.splice(taskIndex, 1);

      this.updateAllStats();
      this.updateProgressBar();
      this.handleEmptyState();
    });
  }

  // ------------------------------
  // Sorting + Drag/Drop
  // ------------------------------
  sortTasksByPriority() {
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    this.tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Completed go to bottom
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const taskList = document.getElementById('taskList');
    this.tasks.forEach(task => {
      if (task.element?.parentNode) {
        taskList.appendChild(task.element);
      }
    });
  }

  setupDragAndDrop() {
    let draggedElement = null;
    let placeholder = null;

    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('task-item') &&
          !e.target.classList.contains('empty-state')) {
        draggedElement = e.target;
        e.target.style.opacity = '0.4';
        placeholder = this.createPlaceholder(e.target);
      }
    });

    document.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('task-item')) {
        e.target.style.opacity = '1';
        placeholder?.remove();
        draggedElement = null;
        placeholder = null;
      }
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedElement && placeholder) {
        const taskList = document.getElementById('taskList');
        const afterElement = this.getDragAfterElement(taskList, e.clientY);
        if (!afterElement) taskList.appendChild(placeholder);
        else taskList.insertBefore(placeholder, afterElement);
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedElement && placeholder) {
        placeholder.parentNode.insertBefore(draggedElement, placeholder);
        placeholder.remove();
        this.updateTaskOrder();
      }
    });
  }

  createPlaceholder(element) {
    const placeholder = document.createElement('li');
    placeholder.className = 'task-placeholder';
    placeholder.style.cssText = `
      height: ${element.offsetHeight}px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      margin: 8px 0;
      border-radius: 8px;
      opacity: 0.7;
    `;
    return placeholder;
  }

  getDragAfterElement(container, y) {
    const draggables = [...container.querySelectorAll('.task-item:not(.empty-state)')];
    return draggables.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  updateTaskOrder() {
    const taskElements = document.querySelectorAll('.task-item:not(.empty-state)');
    const newOrder = [];
    taskElements.forEach((el) => {
      const task = this.tasks.find(t => t.id === el.dataset.taskId);
      if (task) newOrder.push(task);
    });
    this.tasks = newOrder;
  }

  // ------------------------------
  // Empty state + Mobile toggle
  // ------------------------------
  handleEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const activeTasks = this.tasks.filter(task => task.element?.parentNode);
    if (emptyState) {
      emptyState.style.display = activeTasks.length === 0 ? 'block' : 'none';
    }
  }

  setupMobileToggle() {
    let toggleButton = document.querySelector('.mobile-toggle');
    if (!toggleButton) {
      toggleButton = document.createElement('button');
      toggleButton.className = 'mobile-toggle';
      toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
      toggleButton.style.cssText = `
        display: none;
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      `;
      document.body.appendChild(toggleButton);
    }

    toggleButton.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.toggle('mobile-open');
    });

    const mq = window.matchMedia('(max-width: 768px)');
    const handleMobile = e => {
      toggleButton.style.display = e.matches ? 'block' : 'none';
    };
    mq.addListener(handleMobile);
    handleMobile(mq);
  }

  // ------------------------------
  // Animations
  // ------------------------------
  animateTaskIn(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px)';
    el.style.transition = 'all 0.3s ease';
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }

  animateTaskOut(el, cb) {
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-100%)';
    setTimeout(cb, 300);
  }

  animateTaskAction(el) {
    el.style.transform = 'scale(1.05)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 150);
  }
}

// ==============================
// Utilities
// ==============================
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = '/logout';
  }
}

// Initialize Task Manager
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
  taskManager = new TaskManager();
  window.taskManager = taskManager;
});

// ==============================
// Countdown Timer
// ==============================
let countdownInterval;
let countdownTime = 0;
let remainingTime = 0;

function setCountdown(minutes) {
  clearInterval(countdownInterval);
  countdownTime = minutes * 60;
  remainingTime = countdownTime;
  updateDisplay();
}

function startCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateDisplay();
    } else {
      clearInterval(countdownInterval);
      alert("⏰ Time's up!");
    }
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
}

function resetCountdown() {
  clearInterval(countdownInterval);
  remainingTime = countdownTime;
  updateDisplay();
}

function stopAndResetCountdown() {
  clearInterval(countdownInterval);
  remainingTime = countdownTime;
  updateDisplay();
}

function updateDisplay() {
  const minutes = String(Math.floor(remainingTime / 60)).padStart(2, "0");
  const seconds = String(remainingTime % 60).padStart(2, "0");
  document.getElementById("countdown-display").innerText = `${minutes}:${seconds}`;
}

// ==============================
// Stopwatch
// ==============================
let stopwatchInterval;
let elapsedTime = 0;
let running = false;

function updateStopwatch() {
  let time = elapsedTime;
  let hours = Math.floor(time / 3600000);
  time %= 3600000;
  let minutes = Math.floor(time / 60000);
  time %= 60000;
  let seconds = Math.floor(time / 1000);

  document.getElementById("stopwatch").textContent =
    `${hours.toString().padStart(2, "0")}:` +
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}`;
}

function startStopwatch() {
  if (!running) {
    running = true;
    let startTime = Date.now() - elapsedTime;
    stopwatchInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      updateStopwatch();
    }, 1000);
  }
}

function stopStopwatch() {
  running = false;
  clearInterval(stopwatchInterval);
}

function resetStopwatch() {
  running = false;
  clearInterval(stopwatchInterval);
  elapsedTime = 0;
  updateStopwatch();
}

// Init stopwatch display
updateStopwatch();



