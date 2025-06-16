document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tasksList = document.getElementById('tasksList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const overlay = document.getElementById('overlay');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const taskForm = document.getElementById('taskForm');
    const statusMessage = document.getElementById('statusMessage');
    const modalTitle = document.getElementById('modalTitle');
    const taskCount = document.getElementById('taskCount');
    const currentYear = document.getElementById('currentYear');
    const themeToggle = document.getElementById('themeToggle');
    
    // Form inputs
    const taskIdInput = document.getElementById('taskId');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const dueDateInput = document.getElementById('dueDate');
    const priorityInput = document.getElementById('priority');
    const categoryInput = document.getElementById('category');
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // API configuration
    const API_URL = 'http://localhost:3000/tasks';
    
    // Current filter state
    let currentFilters = {
        status: 'all',
        priority: 'all',
        category: 'all'
    };
    
    // All tasks and filtered tasks
    let allTasks = [];
    let filteredTasks = [];
    
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update icon
        themeToggle.innerHTML = newTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        
        // Save preference
        localStorage.setItem('theme', newTheme);
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
    
    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        
        setTimeout(() => {
            statusMessage.style.display = 'none';
            statusMessage.className = 'status-message';
        }, 3000);
    }
    
    // Open modal
    function openModal(isEdit = false) {
        taskModal.classList.add('active');
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        modalTitle.textContent = isEdit ? 'Editar Tarea' : 'Nueva Tarea';
    }
    
    // Close modal
    function closeModal() {
        taskModal.classList.remove('active');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        taskForm.reset();
        taskIdInput.value = '';
    }
    
    // Fetch all tasks
    async function fetchTasks() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            allTasks = await response.json();
            updateCategoryFilters();
            applyFilters();
        } catch (error) {
            console.error('Error al cargar las tareas:', error);
            showStatus('No se pudieron cargar las tareas. Intenta de nuevo.', 'error');
        }
    }
    
    // Update category filters based on available categories
    function updateCategoryFilters() {
        const categoryFilters = document.getElementById('categoryFilters');
        const allButton = categoryFilters.querySelector('[data-category="all"]');
        
        // Clear existing category filters except "All"
        while (categoryFilters.children.length > 1) {
            categoryFilters.removeChild(categoryFilters.lastChild);
        }
        
        // Get unique categories
        const categories = [...new Set(allTasks
            .map(task => task.category)
            .filter(category => category && category.trim() !== '')
        )];
        
        // Add category filter buttons
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.setAttribute('data-category', category);
            button.textContent = category;
            
            button.addEventListener('click', () => {
                document.querySelectorAll('[data-category]').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                currentFilters.category = category;
                applyFilters();
            });
            
            categoryFilters.appendChild(button);
        });
    }
    
    // Apply filters to tasks
    function applyFilters() {
        filteredTasks = allTasks.filter(task => {
            // Filter by status
            if (currentFilters.status === 'pending' && task.completed) return false;
            if (currentFilters.status === 'completed' && !task.completed) return false;
            
            // Filter by priority
            if (currentFilters.priority !== 'all' && task.priority !== currentFilters.priority) return false;
            
            // Filter by category
            if (currentFilters.category !== 'all' && task.category !== currentFilters.category) return false;
            
            return true;
        });
        
        renderTasks();
    }
    
    // Render tasks
    function renderTasks() {
        tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-tasks">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No hay tareas</h3>
                    <p>No se encontraron tareas con los filtros aplicados.</p>
                    <button id="clearFiltersBtn" class="add-task-btn">Limpiar filtros</button>
                </div>
            `;
            
            document.getElementById('clearFiltersBtn').addEventListener('click', () => {
                // Reset filters
                currentFilters = {
                    status: 'all',
                    priority: 'all',
                    category: 'all'
                };
                
                // Reset active buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector('[data-filter="all"]').classList.add('active');
                document.querySelector('[data-priority="all"]').classList.add('active');
                document.querySelector('[data-category="all"]').classList.add('active');
                
                applyFilters();
            });
        } else {
            filteredTasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = `task-card priority-${task.priority}`;
                if (task.completed) taskCard.classList.add('completed');
                
                // Format date if exists
                let formattedDate = '';
                if (task.due_date) {
                    const date = new Date(task.due_date);
                    formattedDate = date.toLocaleDateString();
                }
                
                // Check if task is overdue
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
                
                taskCard.innerHTML = `
                    <div class="task-header">
                        <div class="task-title">
                            ${task.completed ? '<i class="fas fa-check-circle" style="color: var(--success-color)"></i>' : ''}
                            ${isOverdue ? '<i class="fas fa-exclamation-circle" style="color: var(--error-color)"></i>' : ''}
                            ${task.title}
                        </div>
                        <div class="task-actions">
                            <button class="complete-btn" title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                                <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                            </button>
                            <button class="edit-btn" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-info">
                        ${task.priority ? `
                            <span class="task-detail priority-${task.priority}">
                                <i class="fas fa-flag"></i>
                                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                        ` : ''}
                        ${task.category ? `
                            <span class="task-detail">
                                <i class="fas fa-tag"></i>
                                ${task.category}
                            </span>
                        ` : ''}
                        ${task.due_date ? `
                            <span class="task-detail ${isOverdue ? 'priority-alta' : ''}">
                                <i class="fas fa-calendar"></i>
                                ${formattedDate}
                            </span>
                        ` : ''}
                    </div>
                `;
                
                // Event listeners for task actions
                taskCard.querySelector('.complete-btn').addEventListener('click', () => toggleTaskCompletion(task.id));
                taskCard.querySelector('.edit-btn').addEventListener('click', () => editTask(task));
                taskCard.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
                
                tasksList.appendChild(taskCard);
            });
        }
        
        // Update task count
        taskCount.textContent = filteredTasks.length;
    }
    
    // Toggle task completion status
    async function toggleTaskCompletion(id) {
        try {
            const response = await fetch(`${API_URL}/${id}/toggle`, {
                method: 'PATCH'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Update task in local arrays
            const taskIndex = allTasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                allTasks[taskIndex].completed = result.completed;
                
                showStatus(
                    result.completed ? 'Tarea completada correctamente' : 'Tarea marcada como pendiente', 
                    'success'
                );
                
                applyFilters();
            }
        } catch (error) {
            console.error('Error al actualizar el estado de la tarea:', error);
            showStatus('No se pudo actualizar el estado de la tarea', 'error');
        }
    }
    
    // Edit task
    function editTask(task) {
        // Fill form with task data
        taskIdInput.value = task.id;
        titleInput.value = task.title;
        descriptionInput.value = task.description || '';
        priorityInput.value = task.priority || 'media';
        categoryInput.value = task.category || '';
        
        // Format date for input if exists
        if (task.due_date) {
            // Parse the date and format it as YYYY-MM-DD for the input
            const date = new Date(task.due_date);
            const formattedDate = date.toISOString().split('T')[0];
            dueDateInput.value = formattedDate;
        } else {
            dueDateInput.value = '';
        }
        
        // Open modal in edit mode
        openModal(true);
    }
    
    // Delete task
    async function deleteTask(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Remove task from local arrays
            allTasks = allTasks.filter(task => task.id !== id);
            
            showStatus('Tarea eliminada correctamente', 'success');
            
            applyFilters();
        } catch (error) {
            console.error('Error al eliminar la tarea:', error);
            showStatus('No se pudo eliminar la tarea', 'error');
        }
    }
    
    // Submit task form (create/update)
    async function submitTaskForm(event) {
        event.preventDefault();
        
        // Get form data
        const taskData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            priority: priorityInput.value,
            category: categoryInput.value.trim(),
            due_date: dueDateInput.value || null
        };
        
        const isEdit = taskIdInput.value !== '';
        const url = isEdit ? `${API_URL}/${taskIdInput.value}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (isEdit) {
                // Update task in local array
                const taskIndex = allTasks.findIndex(task => task.id === parseInt(taskIdInput.value));
                if (taskIndex !== -1) {
                    allTasks[taskIndex] = result;
                }
                showStatus('Tarea actualizada correctamente', 'success');
            } else {
                // Add new task to local array
                allTasks.push(result);
                showStatus('Tarea creada correctamente', 'success');
            }
            
            closeModal();
            applyFilters();
        } catch (error) {
            console.error('Error al guardar la tarea:', error);
            showStatus('No se pudo guardar la tarea', 'error');
        }
    }
    
    // Event listeners
    addTaskBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    taskForm.addEventListener('submit', submitTaskForm);
    
    // Filter button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get filter type and value
            if (button.hasAttribute('data-filter')) {
                const status = button.getAttribute('data-filter');
                currentFilters.status = status;
                
                // Update active class
                document.querySelectorAll('[data-filter]').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            } else if (button.hasAttribute('data-priority')) {
                const priority = button.getAttribute('data-priority');
                currentFilters.priority = priority;
                
                // Update active class
                document.querySelectorAll('[data-priority]').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            }
            
            applyFilters();
        });
    });
    
    // Initialize
    fetchTasks();
});