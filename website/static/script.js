// Task Dashboard JavaScript
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

    // Load existing tasks from DOM
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

    // Update progress bar based on completion rate
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

    // Calculate completion rate
    getCompletionRate() {
        if (this.tasks.length === 0) return 0;
        const completed = this.tasks.filter(task => task.completed).length;
        return Math.round((completed / this.tasks.length) * 100);
    }

    // Update all statistics
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
        if (element) {
            element.textContent = value;
        }
    }

    getLatestTask() {
        if (this.tasks.length === 0) return 'No tasks yet';
        // Sort by creation order (assuming last in DOM is latest)
        return this.tasks[this.tasks.length - 1].title;
    }

    // Setup all event listeners
    setupEventListeners() {
        this.setupFormSubmission();
        this.setupTaskActions();
        this.setupDragAndDrop();
        this.setupMobileToggle();
    }

    // Handle form submission for adding tasks
    setupFormSubmission() {
        const form = document.getElementById('addTaskForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevent default form submission for instant UI update
                
                const formData = new FormData(form);
                const title = formData.get('title');
                const priority = formData.get('priority').toLowerCase();
                
                if (title.trim()) {
                    this.addTask(title.trim(), priority);
                    form.reset();
                }
            });
        }
    }

    // Add new task to UI
    addTask(title, priority) {
        const taskId = 'temp_' + Date.now(); // Temporary ID
        const task = {
            id: taskId,
            title: title,
            priority: priority,
            completed: false,
            element: null
        };

        // Create and add task element
        const taskElement = this.createTaskElement(task);
        task.element = taskElement;
        this.tasks.push(task);

        // Add to DOM
        const taskList = document.getElementById('taskList');
        taskList.appendChild(taskElement);

        // Update UI
        this.updateAllStats();
        this.updateProgressBar();
        this.sortTasksByPriority();
        this.handleEmptyState();

        // Animate in
        this.animateTaskIn(taskElement);
    }

    // Create task HTML element
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

    // Setup task action handlers (complete/delete)
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

    // Toggle task completion status
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.element.classList.toggle('completed', task.completed);
            
            this.updateAllStats();
            this.updateProgressBar();
            this.sortTasksByPriority();
            
            // Animation feedback
            this.animateTaskAction(task.element);
        }
    }

    // Delete task
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            
            // Animate out
            this.animateTaskOut(task.element, () => {
                task.element.remove();
                this.tasks.splice(taskIndex, 1);
                
                this.updateAllStats();
                this.updateProgressBar();
                this.handleEmptyState();
            });
        }
    }

    // Sort tasks by priority (High → Medium → Low)
    sortTasksByPriority() {
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        
        this.tasks.sort((a, b) => {
            // Completed tasks can stay in priority order or go to bottom
            // For UX, let's keep priority sorting for completed tasks too
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Completed tasks to bottom
            }
            
            // Sort by priority within completion status
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Reorder DOM elements
        const taskList = document.getElementById('taskList');
        this.tasks.forEach(task => {
            if (task.element && task.element.parentNode) {
                taskList.appendChild(task.element);
            }
        });
    }

    // Setup drag and drop functionality
    setupDragAndDrop() {
        let draggedElement = null;
        let placeholder = null;

        // Drag start
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item') && !e.target.classList.contains('empty-state')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.4';
                
                // Create placeholder
                placeholder = this.createPlaceholder(e.target);
            }
        });

        // Drag end
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.style.opacity = '1';
                if (placeholder && placeholder.parentNode) {
                    placeholder.remove();
                }
                draggedElement = null;
                placeholder = null;
            }
        });

        // Drag over
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedElement && placeholder) {
                const taskList = document.getElementById('taskList');
                const afterElement = this.getDragAfterElement(taskList, e.clientY);
                
                if (afterElement == null) {
                    taskList.appendChild(placeholder);
                } else {
                    taskList.insertBefore(placeholder, afterElement);
                }
            }
        });

        // Drop
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
        placeholder.style.height = element.offsetHeight + 'px';
        placeholder.style.backgroundColor = '#f8f9fa';
        placeholder.style.border = '2px dashed #dee2e6';
        placeholder.style.margin = '8px 0';
        placeholder.style.borderRadius = '8px';
        placeholder.style.opacity = '0.7';
        return placeholder;
    }

    // Get element after drag position
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging):not(.empty-state)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Update task order after drag and drop
    updateTaskOrder() {
        const taskElements = document.querySelectorAll('.task-item:not(.empty-state)');
        const newOrder = [];
        
        taskElements.forEach((element) => {
            const task = this.tasks.find(t => t.id === element.dataset.taskId);
            if (task) {
                newOrder.push(task);
            }
        });
        
        this.tasks = newOrder;
        // Here you could send the new order to backend if needed
    }

    // Handle empty state visibility
    handleEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const activeTasks = this.tasks.filter(task => task.element && task.element.parentNode);
        
        if (emptyState) {
            if (activeTasks.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
        }
    }

    // Setup mobile sidebar toggle
    setupMobileToggle() {
        // Create mobile toggle if not exists
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
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });

        // Show/hide mobile toggle based on screen size
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleMobileView = (e) => {
            toggleButton.style.display = e.matches ? 'block' : 'none';
        };
        
        mediaQuery.addListener(handleMobileView);
        handleMobileView(mediaQuery);
    }

    // Animation helpers
    animateTaskIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        element.style.transition = 'all 0.3s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    animateTaskOut(element, callback) {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateX(-100%)';
        
        setTimeout(callback, 300);
    }

    animateTaskAction(element) {
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

// Utility functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Adjust URL as needed for your Flask app
        window.location.href = '/logout';
    }
}

// Initialize when DOM is loaded
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Make taskManager globally available for any external calls
window.taskManager = taskManager;