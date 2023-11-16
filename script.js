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

function calculateRemainingDays(dueDate, timeZone) {
  const now = moment().tz(timeZone).startOf('day');
  const due = moment.utc(dueDate).tz(timeZone);

  const nowDayOfYear = now.dayOfYear();
  const dueDayOfYear = due.dayOfYear();

  const daysRemaining = dueDayOfYear - nowDayOfYear;
  return daysRemaining;
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
  const table = document.getElementById("taskTable");
  const noDiv = document.getElementById("noTask");
  if(tasks.length == 0) {
    table.style.display = "none";
    noDiv.style.display = "block";
    noDiv.innerHTML = "<h2>No tasks found</h2> <br> <img id='noTaskImg' src='https://cdn-icons-png.flaticon.com/512/5058/5058432.png'>";
    return;
  }
  else{
    noDiv.style.display = "none";
    table.style.display = "block";
  }
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
      var remainingDays = calculateRemainingDays(task.dueDate, 'Asia/Dhaka') + " day(s)";
      var statusIcon;
      var statusButton;
      const row = document.createElement("tr");
      if (calculateRemainingDays(task.dueDate, 'Asia/Dhaka') == 0 && task.status !== "completed") {
        row.classList.add("warning-task");
      }
      if (calculateRemainingDays(task.dueDate, 'Asia/Dhaka') < 0 && task.status !== "completed") {
        row.classList.add("missing-task");
      }
    if (task.status === "completed") {
      statusIcon = "<img width='34' height='34' src='https://img.icons8.com/color/48/checked-checkbox.png' alt='checked-checkbox'/>"
      statusButton = "<img class='iconImg' src='data:image/png;base64,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'>";
      remainingDays = "";
      row.classList.remove("warning-task");
      row.classList.remove("missing-task");
      row.classList.add("completed-task");
    }
    else
    {
      statusButton = "<img class='iconImg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAADrklEQVR4nO3cv08TYRgH8DoaFx2JcXLTwUX7gkIM9K6QgCJREnFxKbEwGQcHFo06KBgX/wK1amLiZNKIdw0ggwFMjIrRTakX469BfrSIHveap+0pqb32jvfe671vn2/yJA19+957H57eXTq8kUjIoqrj21Si31WIvqISjULBa4XoKXiv3usLdToPZfaqRM+pRKeVSiFarqv16Z56rzOU6W9+sBWAilC6GSPaWF/bVBOUGs1cVYi2VnwvswJj673e0EWJandsvK6D6d3l78PflKhmwpgY0W9HREt36/SOwrUpqi05fcVUPyqaue60BuWAfoPnsRWiLypRPXV438R2bh3Cu/rappoc/4nNj3YGsQY4V98BVaL/gMlTqWWaHrc8l1paXHLYqlidLRM1AeP7H++CMfGWCcd57ONsZo1wbnYn8gDc9MLSLgB7OmZLi38y6rQGuLHAmCOxOS6AUPHm4ucjEbpFKMCB/gV7zJrTTUQl2i8Yc6o/i4DJMsAzQybtaZ+xr0Em3DDgmgdV7LwiXnf7DE0OmfIAuk2tDoRKDK7+RaxUgAdjqs1hj3UbqQCTUEMmHTiRLVzn4MYCBa8LX9sqnSc94NH24l12MFG9g1gqkcgXjnEsNikf4IXzLwuf71VfFE6UBx7MDce4MvJaPsCPH3K0T5nk/hB8PD5Fv335KR8g5OvnVXp55BXt7fAfEuaEzvOCJxxgGIOAjEFAxiAgYxCQMQjIGARkDAIyBgEZg4CMQUDGICBjEJAxCMgYBNyQT0aeruZN6iUIWIqRzdGBnml6dnCO5nPuERGQ/sOzf7P0gtjwgEYZnlfEhgY0sjl6svt/PLvOJZ9T06y+xoYFNBw6b2Pdv/W+5jwNCWj4hNeQgIaPeA0HaPiMJxygZVHPD7pubxhQD+8teJ5XGEDLovTm2Ds6fHqGLi/9rnvnCQVolfDsObwg8sQTAtAqw/OCyBsv9ICWA54bxCDwwg+4btHRS2+qIlRCDAov9ICbQQwSTwhAL4hv5xcDxRMGELK+btFrF+er4tiL9/M5TxpAt50YVOcJCei2E4PoPGEBvXYir84TGtBtJ/LsPOEBa3Ui786TAtAJMSg8KQDLEYPEkwbQvibOPvtOg440gPUKAjIGARmDgIxBQMYgIGMQkDEIyBgEZAwCMgYBGYOAjEFAxiCg6IBpyQoBxxGQytqBTFuApgUorluABrUJrRqK0vzfZhm2BoYtgrlvg0zqV3Bu0ChctkHGYDCYiHz5A29C7crf+zQKAAAAAElFTkSuQmCC'>";
      statusIcon = "<img width='32' height='32' src='https://img.icons8.com/nolan/64/hourglass.png' alt='hourglass'/>";
      if (calculateRemainingDays(task.dueDate, 'Asia/Dhaka') < 0) {
        statusIcon = "<img width='32' height='32' src='https://img.icons8.com/officel/128/leave.png' alt='leave'/>";
      }
    }
    row.innerHTML = `
    <td>${task.title}</td>
    <td class="desc-data">${task.description}</td>
    <td>${formattedDueDate}<br>${remainingDays}</td>
    <td>${statusIcon}</td>
    <td>${mapPriorityValueToLabel(task.priority)}</td>
    <td>${task.category}</td>
    <td class="action-column">
    <button class="iconBtn" onclick="ChangeToCompleted('${task._id}')">${statusButton}</button>
    <button class="iconBtn" onclick="DetailsShow('${task._id}')"><img class="iconImg" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD2UlEQVR4nO2bS4yTVRTH74grUViCMaIxsEAIEqffOR0CFKbnfJVA0M0s3KkLFywMbA2BmBBjQsJjQVgg7vABISQakPacj7ogMWowuphodGGihkCCCQ95hMcUz5AO7Tf9aDvSTr/HPzlJF/fm3vO75557b3vqXKZMmTJ1IEat9dsI9CKhnCiirHNpBMBTJhMM8pFztaGUAtB6ROxINQBGmSAI3hwIAK7HKnjVhcWceAS6n0BvTY0NcsPPK7ikA2iUD/JO01ZAPe/nTj/v0gKAhmX+tO0A+iOvKM9NBwCvkmuZE0BOjo0dnZN4AIyyOzIxTh6PCQZQ8KoLCeRqmxPircQCYNDjHRyPt33Q9YkEQCirCfWrydvgo0Fc8vPVxYnMASb2yisZ9AtCvfeISBgvFKpPuyQCqIuwsoRQD1vYRyTFQy7JAOqycLeICM/LIoSwstQlHUBdPugbhHo9BGGPSwsAk4/ybjMA+cmlCcAo6oLQ/C6nCsDY2NE5PZ8fDzAAUwYABygCuKNvd7q32EQAZwA0iwBO8xaYDWUAMIuAWrYFcEByAGengKb7FODZAgD6DYNsK3oykj4AXnnlY3c6TveAnotjAMBCn0H2Ecg5+wF10kDOMcpegko+sQDWjwQvEMipttsI5CQNy6JEAWA8g1ZL1HEuAbkwo/oCHsAkWMLqi105/9AuFXPyUuwBMKq2aKe+J5tKw18/a2afCeVMi3anYw3ASudahPeu1pVktSFC/TDcvgS6JrYAGOVgdytaGyKQSmMfAj3QEwD9EIH+0uSMVym26+OjcrMfMh5fAKhXGuezedXZZ9r1eQ1OzWuChnolzgD+bZpTBwVT9tN5KGdciy0ABv2teTVldds+XrA21OfXGAOQT0LOHOu23IZQPo4vANQN008KeS+qPYFuDbcnr1KKLQA71hj122lOgXxmJbaFQvVJM7v2EujnLdqd7Wq4wQPgHOfKy6NK6B5UirSuJ7LsPwr6ciwBWN2gD8ErU/OCwO+gjrBx5a/afaDrgXkAADx4/MjvBPpPKa+vTs0tV17OqN934Px3JS9YNqPBeZYBWMgyyN8N19gmCJYTiiCvM8qnhPIXg9wxI9Q/GfUIYbD5f/3jhHt0v49cLdTztrI2tiUye8JOX9EwhIfa6XY+YTZjh8Pqq/Mgf9SrPu3VF772NiazKACPXdw3ADI+mtfnbEwLWwa52bIdyA272fXF+X4C8EeCVTYeYfA2gd6NgHSbQDa6JItRf4hwfqIv5fGzLQJ9PwLAFpcGbRr+8ikG+Tnk/HaXJvGK8lxG+cCevj2p//1vkPuhg79zy8n36QAAAABJRU5ErkJggg=="></button>
    <button class="iconBtn" onclick="EditTask('${task._id}')"><img class="iconImg" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHUlEQVR4nO2dy24cRRSGG1gAIkLAji3hIjZkgedUxyRMTJ8qWwobBOEFiOAFACGBFISEQOGyBl6AywMEPOeMJlxChARbILAyYZEgEgmCHMDCjWpmZAfU3TPurprqqq5fqo3lcZ36v65TNafb1UkSFRUVFRUVFeWTspRQAr8nBZ9DwX9MGn2vf4a9QeY6vmCl0tHdKOgzKTivaijoU/27ruMNSpmgIwh8aZb5OxCAL60CH3YddxCSveHDOs3Ma/4uBLqMYnCP6/i9FvYGmQTa3Kv5Ow34tOsxdNd8MZ0JcWFeXNopXpT53RohdFerD358pynzpwvyd0YDPHbsoxvGVwjwW1LwWQS+KAX9bSpg2bQBbSHQNxKGj9QdowR+RgraNgOAfjdifJp+eTMKegGBf3FuspgLxNXVpeF9riGg4N8am4/p4EkJ9LNzU8WeB/9ik3EbgQD8be0ATiQnrpfAr7k2UloEsLZ26kabEFDQO03M/9C1ibL2lUebWY/urRqjEixR0HkFwwO2ICjglVoAvL3ygbZQ0NezFmFt/jX7/F+tQAAe1c/5s6fWOqZ8XC908oH1WxKPpP5rfm4Dgq4HrSwP99fa7VQtuLr06nOhSRWbbxaCTn+CjtQKUG81K6bU6f6B0W1JmObnRiAAbdYuP+gvWWX7fH3ld8D8vBGEJuZrYTrolwVVe0r5Z34+yeF0GXuDpaq/K4GfQsH/7KSdlLBRoNPyQlEwg6RD5ss9zoTxbUkTVU9d2ykEkPLxpHvm5/NC0AU8IwGX5f8mNRXPzc/nhWBEKPivogD6/dG+pLvm5/OuCY1V1nnScfPloiD4DkBZNH8HgqDz/f7oJisD8BmAWoD5RraaIQJQIZjvKwAVivk+AlAhme8bABWa+T4BUCGa7wsAFar5PgBQIZvfdgBqQebrfqriGN+CFfSSbsZrZG0FoFpivr7Rrx/4uuYzV5s8gecFANUS87XGjzz+77P6CYxgAagWma+lH3kp+PxWkABUCxdc6/60BcDK8nC/BLrSliu/cwCw5N60S/M7BCC/TgreaEva6RyArEcH22h+ZwCg4LfbaH5HAOR20o+h8kLwADIb6cdgbSd4AGg6/RgurAUOIDebfixUNYMGkJlMP5ZKykEDQFPpx2I9P2AAuZn0Y/lmSrAAEAapAfOv1Ckv7EUBA+AmtZ8N/flsie6yHWfAAOirOqbrmaPTV7IgBQtAAlNbTe8EANWjR0v+69C56Z0AoIVAR6cz4WybTO8MAB8UAThWBOBYEYBjRQCOFQE4VgTgWBGAY0UAjhUBOFYE4FgRgGNFAI4VAThWBBA6gFAObLKhNTh1a5E3CPynsU5COrLMtFAM7i+cAUAXjHUS2qF9JjU5J7RoBtAXBjuhN4spMyUdFwoaFgIQfNJYJ/pMaOPHsAcgrDjQVh0cLhvraHp08cWSzs4dPfT57UnHpNJP7kCgH8vyv37PgtEOJfDzVe9J7BIEpc2veH8kwvBZ451OXtbDP5V1KoF/8Pkc6XmlU27plT99Zsne6YnAT8zxogJWgp7W27MQvif0+6N9eiyTMRUvuLuNtmWPH7MakBT06gwAnW0I/EpiW3pxQeAPXA9Wtqwh0PvGF97qf5ygl029Vc7vRtsS6PUFmr+rTNDjlQtz+G3Des6fJb3iS6Dn9N63BYbkC2lAF/RW09pup/baIOiQFPQGAp0ZB1lSRfWpoR7D2HA6o8sLMl1/yEm6iYqKioqKikqs6l/B/feg9bxB0AAAAABJRU5ErkJggg=="></button>
    <button class="iconBtn" onclick="RemoveTasks('${task._id}')"><img class="iconImg" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtElEQVR4nO1bTWhTQRBef1DEH3rVo78g2h5sZtKApDU7SU8e1NwK1ot4tCpKQRG9tEJBRRQEFUFUsPdqM/MaBRE9qCfBXzy1HqsepFo1svl9bTRNm/eSF9kPBgKbnb+3b2d23qxSFha+IrHj/toYcmcszHpehNxp5qpmRaLd2aKRRwn5N6FkFkbZuQ9iId6smglxcNoIeXLhhpc5YnIXSqtqBiST95YQ8quC8hr4HQEPapQT8yEzh0DeupzwyvBWQYcOpRIu45+Fw09WLJSXmWt4FJ0ATlwFHYR8qugATO2plV8Mea9rFZxUQQcBDxUUjuPYjlr5GR6lFcBDqtGg1tGVsXZe/y/SyNdKK8DZXem/1ZDhUeLH1yr91+jmm+E6nIpq5Eca5Zd3u7u3pEF+EsjDBMhOb41H50CWeQCMrNoRKL2eGB8L8WYNMuUORwR8Q6NcDRIZnWaGX5nSmNpU+9MHuehievm0Or1YBRRGNwK54npY52tmqoGfFtLSaFu6RQUcRsdC+m10r5mhRnmZD0HTtSQ19YLR0eiad8Dzmhlq4FuuONynAg5CPlIKm3LTk/BHrtOZRh4m4P755vZ+U04nHnafPj0Lh4R8qdGhbd4EfEF5h8wiDc4xjfKl4YbNTZ/Na2B0Vl4jnDudfc1vMB8JnGQQKKtLTqevvm/UlC90mOigAoJipEKe9F0YWQewXQFUxSugw7ydkD+ZZCQaTa8qG4+k1hHKBwJ+b37PHjdzCOSF4UHto9ua7hUg4P5iQhJORcv5SI9r5+6ZPW7K4q6Q1t98DkBXaSyUipWPS6/LAWVHVzPHlYCdqiTLOgDtCnhpXwG0e0DGboJoo8Ck8htkwyDbPIBsIiQ2E9Q2FRZ7FlCVo4U9DJE9DYo9DpOtB4gtiGhbEUrZkpgqC5O2Jthri6Joq8IZWxbH//W7AHBfyYAxLB+XfYVx0w9cLmcMi6k0yOGmc0C0Ld2iUa4T8pm/NSt0d48sNy14hpJb7y37e1OGnDXtsXN1pwXSAfVEfR0AMp5zAL9WAQGhvMl9RJVx34Xp/AUGjfJ9d+TxatVgdMPIGkL+4Vlj5FwgkIHi5oRyVDUYBHK89BldBnwXGA+nNxY6MQn4WxykSzUI2VAJ/C2vy3RXxNlQH8HI52a1pt82LfV16wozspDvzLi7ADyo6oVoNL1UA98NQE9g/iHwXaOTqi8yi3RIDmmUiYYZjjJhdPClKbJamLt88Q4nQiHeH0c+WA/KyupwIk1xj9BCBRt/AKPHRSjK9qhzAAAAAElFTkSuQmCC"></button>
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
    const formattedDueDate = new Date(task.dueDate).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }
      );
      var status;
      if (task.status === "completed")
          status = "Not Done";
      else
          status = "Complete";

      const due = calculateRemainingDays(task.dueDate, 'Asia/Dhaka');
      const taskDetailsContent = document.getElementById("taskDetailsContent");
      taskDetailsContent.innerHTML = `
      <p><strong>Title&emsp;&emsp;&emsp;&emsp;: </strong> ${task.title}</p>
      <p><strong>Description&ensp;: </strong> ${task.description}</p>
      <p><strong>Due&ensp;Date&emsp;&ensp;: </strong> ${formattedDueDate} (${due} days)</p>
      <p><strong>Priority&emsp;&emsp;&ensp;: </strong> ${mapPriorityValueToLabel(task.priority)}</p>
      <p><strong>Status&emsp;&emsp;&emsp;: </strong> ${task.status}</p>
      <p><strong>Category&ensp;&emsp;: </strong> ${task.category}</p>
      <center>
      <button onclick="EditTask('${task._id}')">Edit</button>
      <button id="statusBtn" onclick="ChangeToCompleted('${task._id}')">${status}</button>
      <button onclick="RemoveTasks('${task._id}')">Delete</button>
      </center>
      `;
      document.getElementById("statusBtn").addEventListener("click", function() {
        if (document.getElementById("statusBtn").innerHTML === "Complete") {
          document.getElementById("statusBtn").innerHTML = "Not Done";
        } else {
          document.getElementById("statusBtn").innerHTML = "Complete";
        }
      });
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
      const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
      document.getElementById("editDueDate").value = dueDate;
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
