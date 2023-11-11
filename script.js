document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
      window.location.href = "/login";
  }

  await fetchAndPopulateCategories(token);

  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.addEventListener("change", FetchToDisplayTheTasks);

  FetchToDisplayTheTasks();
});

async function fetchAndPopulateCategories(token) {
  try {
      const categoriesResponse = await fetch('/categories', {
          headers: {
              'Authorization': `${token}`,
          },
      });

      if (!categoriesResponse.ok) {
          throw new Error(`Categories request failed with status ${categoriesResponse.status}`);
      }

      const categoriesData = await categoriesResponse.json();

      const categoryFilterSelect = document.getElementById('categoryFilter');
      categoryFilterSelect.innerHTML = '<option value="">All</option>';

      categoriesData.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          categoryFilterSelect.appendChild(option);
      });
  } catch (error) {
      console.error('Error fetching categories:', error);
  }
}

async function FetchToDisplayTheTasks() {
  const token = localStorage.getItem("token");
  try {
      const category = document.getElementById("categoryFilter").value;
      const sortOption = document.getElementById("sortOption").value;
      const search = document.getElementById("searchInput").value;
      const status = document.getElementById("statusFilter").value;

      const userInfo = await fetch('/user', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
          },
      })
          .then(response => response.json())
          .catch(error => {
              console.error('User information fetch error:', error);
              return {};
          });

      const userId = userInfo.userId;

      const apiUrl = `/tasks?sortBy=${sortOption}&category=${category}&status=${status}&search=${search}&userId=${userId}`;

      fetch(apiUrl, {
          headers: {
              Authorization: `${token}`,
          },
      })
          .then((response) => response.json())
          .then((tasks) => DisplayTheTasks(tasks))
          .catch((error) => console.error(error));

  } catch (error) {
      console.error('Error fetching tasks:', error);
  }
}


function logout() {
  localStorage.removeItem("token");
  window.history.replaceState({}, document.title, "/login");
  window.location.href = "/login";
}

function GoBack() {
  window.location.href = "/viewTasks";
}

function mapPriorityValueToLabel(value) {
  switch (value) {
    case 1:
      return "HIGH";
    case 2:
      return "MEDIUM";
    case 3:
      return "LOW";
    default:
      return "";
  }
}

function DisplayTheTasks(tasks) {
  const viewTasks = document.getElementById("viewTasks");
  viewTasks.innerHTML = "";

  tasks.forEach((task) => {
    // Format the dueDate to a string with "dd-mm-yyyy" format
    const formattedDueDate = new Date(task.dueDate).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }
    );
    
    var statusIcon;
    const row = document.createElement("tr");
    if (task.status === "completed") {
      statusIcon = "<img width='36' height='36' src='https://img.icons8.com/color/48/checked-checkbox.png' alt='checked-checkbox'/>"
      row.classList.add("completed-task");
    }
    else
    {
      statusIcon = "<img width='36' height='36' src='https://img.icons8.com/nolan/64/hourglass.png' alt='hourglass'/>"
    }
    row.innerHTML = `
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${formattedDueDate}</td>
            <td>${statusIcon}</td>
            <td>${mapPriorityValueToLabel(task.priority)}</td>
            <td>${task.category}</td>
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
  const token = localStorage.getItem("token");

  fetch(`/tasks/${taskId}`, {
    headers: {
      Authorization: `${token}`,
    },
  })
    .then((response) => response.json())
    .then((task) => {
      const taskDetailsContent = document.getElementById("taskDetailsContent");
      taskDetailsContent.innerHTML = `
                  <p><strong>Title:</strong> ${task.title}</p>
                  <p><strong>Description:</strong> ${task.description}</p>
                  <p><strong>Due Date:</strong> ${task.dueDate}</p>
                  <p><strong>Priority:</strong> ${mapPriorityValueToLabel(task.priority)}</p>
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
    .catch((error) => console.error(error));
}

function OpenDetailsWindow() {
  const taskDetailsModal = document.getElementById("taskDetailsModal");
  taskDetailsModal.style.display = "block";
}

function CloseDetailsWindow() {
  const taskDetailsModal = document.getElementById("taskDetailsModal");
  taskDetailsModal.style.display = "none";
}

function ChangeToCompleted(taskId) {
    const token = localStorage.getItem("token");
  
    fetch(`/tasks/${taskId}/complete`, {
      method: "PUT",
      headers: {
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          FetchToDisplayTheTasks();
        } else {
          console.error("Marking task as completed Failed");
        }
      })
      .catch((error) => console.error(error));
  }
  

function RemoveTasks(taskId) {
  const token = localStorage.getItem("token");

  fetch(`/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        FetchToDisplayTheTasks();
        CloseDetailsWindow();
      } else {
        console.error("Delete task Failed");
      }
    })
    .catch((error) => console.error(error));
}

let currentTaskId;

function EditTask(taskId) {
  const token = localStorage.getItem("token");

  fetch(`/tasks/${taskId}`, {
    headers: {
      Authorization: `${token}`,
    },
  })
    .then((response) => response.json())
    .then((task) => {
      currentTaskId = taskId;
      document.getElementById("editTitle").value = task.title;
      document.getElementById("editDescription").value = task.description;
      document.getElementById("editDueDate").value = task.dueDate;
      document.getElementById("editPriority").value = task.priority;
      document.getElementById("editCategory").value = task.category;

      OpenEditWindow();
    })
    .catch((error) => console.error(error));
}

function OpenEditWindow() {
  const editModal = document.getElementById("editModal");
  editModal.style.display = "block";
}

function CloseEditWindow() {
  const editModal = document.getElementById("editModal");
  editModal.style.display = "none";
}

function SubmitEditForm() {
  const token = localStorage.getItem("token");

  const dueDate = document.getElementById("editDueDate").value;
  const description = document.getElementById("editDescription").value;
  const title = document.getElementById("editTitle").value;
  const category = document.getElementById("editCategory").value;
  const priority = document.getElementById("editPriority").value;

  fetch(`/tasks/${currentTaskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${token}`,
    },
    body: JSON.stringify({
      title: title,
      description: description,
      dueDate: dueDate,
      priority: priority,
      category: category,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Test: " + description);
        return response.json();
      } else {
        throw new Error("Failed to update task");
      }
    })
    .then((updatedTask) => {
      console.log("Task updated successfully:", updatedTask);
      FetchToDisplayTheTasks();
      CloseEditWindow();
    })
    .catch((error) => console.error(error));
}
