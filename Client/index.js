document.addEventListener('DOMContentLoaded', () => {
    FetchToDisplayTheTasks();
});

function FetchToDisplayTheTasks() {
    const category = document.getElementById('categoryFilter').value;
    const sortOption = document.getElementById('sortOption').value;
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;

    fetch(`/tasks?sortBy=${sortOption}&category=${category}&status=${status}&search=${search}`)
        .then(response => response.json())
        .then(tasks => DisplayTheTasks(tasks))
        .catch(error => console.error(error));
}

function GoBack() {
    window.history.back();
}

function mapPriorityValueToLabel(value) {
    switch (value) {
        case 1:
            return 'HIGH';
        case 2:
            return 'MEDIUM';
        case 3:
            return 'LOW';
        default:
            return '';
    }
}

function DisplayTheTasks(tasks) {
    const viewTasks = document.getElementById('viewTasks');
    viewTasks.innerHTML = '';

    tasks.forEach(task => {
        // Format the dueDate to a string with "dd-mm-yyyy" format
        const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${formattedDueDate}</td>
            <td>${mapPriorityValueToLabel(task.priority)}</td>
            <td>${task.category}</td>
            <td>${task.status}</td>
            <td class="action-column">
            <button onclick="ChangeToCompleted('${task._id}')">Complete</button>
                <button onclick="DetailsShow('${task._id}')">Details</button>
                <button onclick="EditTask('${task._id}')">Edit</button>
                <button onclick="RemoveTasks('${task._id}')">Delete</button>
            </td>
        `;
        viewTasks.appendChild(row);
    });
}



function DetailsShow(taskId) {
    fetch(`/tasks/${taskId}`)
        .then(response => response.json())
        .then(task => {
            const taskDetailsContent = document.getElementById('taskDetailsContent');
            taskDetailsContent.innerHTML = `
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Due Date:</strong> ${task.dueDate}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Category:</strong> ${task.category}</p>
                <p><strong>Status:</strong> ${task.status}</p>
                <center>
                <button onclick="EditTask('${task._id}')">Edit</button>
                <button onclick="ChangeToCompleted('${task._id}')">Complete</button>
                <button onclick="RemoveTasks('${task._id}')">Delete</button>
                </center>
            `;
            OpenDetailsWindow();
        })
        .catch(error => console.error(error));
}

function OpenDetailsWindow() {
    const taskDetailsModal = document.getElementById('taskDetailsModal');
    taskDetailsModal.style.display = 'block';
}

function CloseDetailsWindow() {
    const taskDetailsModal = document.getElementById('taskDetailsModal');
    taskDetailsModal.style.display = 'none';
}

function ChangeToCompleted(taskId) {
    fetch(`/tasks/${taskId}/complete`, { method: 'PUT' })
        .then(response => {
            if (response.ok) {
                FetchToDisplayTheTasks();
            } else {
                console.error('Marking task as completed Failed');
            }
        })
        .catch(error => console.error(error));
}

function RemoveTasks(taskId) {
    fetch(`/tasks/${taskId}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                FetchToDisplayTheTasks();
                CloseDetailsWindow();
            } else {
                console.error('Delete task Failed');
            }
        })
        .catch(error => console.error(error));
}

let currentTaskId;

function EditTask(taskId) {
    fetch(`/tasks/${taskId}`)
        .then(response => response.json())
        .then(task => {
            currentTaskId = taskId;
            document.getElementById('editTitle').value = task.title;
            document.getElementById('editDescription').value = task.description;
            document.getElementById('editDueDate').value = task.dueDate;
            document.getElementById('editPriority').value = task.priority;
            document.getElementById('editCategory').value = task.category;

            OpenEditWindow();
        })
        .catch(error => console.error(error));
}


function OpenEditWindow() {
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'block';
}

function CloseEditWindow() {
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'none';
}

function SubmitEditForm() {
    const dueDate = document.getElementById('editDueDate').value;
    const description = document.getElementById('editDescription').value;
    const title = document.getElementById('editTitle').value;
    const category = document.getElementById('editCategory').value;
    const priority = document.getElementById('editPriority').value;

    fetch(`/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            description: description,
            dueDate: dueDate,
            priority: priority,
            category: category,
        }),
    })
    
        .then(response => {
            if (response.ok) {
                console.log("test :" + description);
                return response.json();
            } else {
                throw new Error('Failed to update task');
            }
        })
        .then(updatedTask => {
            console.log('Task updated successfully:', updatedTask);
            FetchToDisplayTheTasks();
            CloseEditWindow();
        })
        .catch(error => console.error(error));
}


