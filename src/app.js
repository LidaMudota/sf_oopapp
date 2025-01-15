import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/style.css";
import taskFieldTemplate from "./templates/taskField.html";
import noAccessTemplate from "./templates/noAccess.html";
import { User } from "./models/User";
import { generateTestUser, generateTestTasks } from "./utils";
import { State } from "./state";
import { authUser, addUser, deleteUser } from "./services/auth";
import { Task } from "./models/Task";

export const appState = new State();

const loginForm = document.querySelector("#app-login-form");
const navBar = document.querySelector("#navbarSupportedContent");

// Генерация тестового пользователя и задач
const testUser = generateTestUser(User); // Создаём тестового пользователя
User.generateAdmin(); // Создаём администратора
generateTestTasks(Task, testUser.id); // Генерируем задачи для пользователя

loginForm.addEventListener("submit", function (e) {
  e.preventDefault(); // Останавливаем стандартное поведение формы
  const formData = new FormData(loginForm);
  const login = formData.get("login");
  const password = formData.get("password");

  let hasAccess = authUser(login, password);
  console.log("Is Admin:", appState.currentUser.isAdmin); // Проверка  

  if (!hasAccess) {
    alert("Доступ запрещен: Неверный логин или пароль!");
    return;
  }

  if (appState.currentUser.isAdmin) {
    console.log("Adding admin panel..."); // Проверка
    document.querySelector("#content").innerHTML = ""; // Очистить содержимое
  
    const adminControls = `
      <div id="admin-controls" class="mt-4">
        <h3>Admin Controls</h3>
        <input id="new-user-login" type="text" placeholder="New User Login" class="form-control mb-2" />
        <input id="new-user-password" type="password" placeholder="New User Password" class="form-control mb-2" />
        <button id="add-user-btn" class="btn btn-success mb-2">Add User</button>
        <input id="delete-user-login" type="text" placeholder="Delete User Login" class="form-control mb-2" />
        <button id="delete-user-btn" class="btn btn-danger">Delete User</button>
      </div>
    `;
    document.querySelector("#content").insertAdjacentHTML("beforeend", adminControls);
    console.log("Admin panel HTML:", document.querySelector("#content").innerHTML);
  
    // События кнопок
    document.getElementById("add-user-btn").addEventListener("click", () => {
      const login = document.getElementById("new-user-login").value;
      const password = document.getElementById("new-user-password").value;
      if (login && password) {
        addUser(login, password);
        alert("User added successfully!");
      } else {
        alert("Please provide login and password.");
      }
    });
  
    document.getElementById("delete-user-btn").addEventListener("click", () => {
      const login = document.getElementById("delete-user-login").value;
      if (login) {
        deleteUser(login);
        alert("User deleted successfully!");
      } else {
        alert("Please provide a login.");
      }
    });
  }  

  // Если доступ есть
  navBar.innerHTML = `
    <span class="navbar-text text-light">Здравствуйте, ${appState.currentUser.login}</span>
    <button id="sign-out-btn" class="btn btn-outline-danger ms-3">Sign Out</button>
  `;
  document.querySelector("#sign-out-btn").addEventListener("click", handleSignOut);
  document.querySelector("#content").innerHTML = taskFieldTemplate;

  const userId = appState.currentUser.id; // Получаем ID текущего пользователя
  renderTasks(userId); // Рендер задач  
  
  document.getElementById("add-task-btn").addEventListener("click", () => {
    handleAddTask(userId);
  });  
});

function renderTasks(userId) {
  const tasks = appState.currentUser.isAdmin
    ? Task.getAllTasks()
    : Task.getTasksByUserId(userId);

  const columns = {
    backlog: document.getElementById("backlog-tasks"),
    ready: document.getElementById("ready-tasks"),
    "in-progress": document.getElementById("in-progress-tasks"),
    finished: document.getElementById("finished-tasks"),
  };

  // Очистка старых задач перед рендером
  Object.values(columns).forEach(column => (column.innerHTML = ""));

  // Рендер задач
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.setAttribute("draggable", "true");
    li.setAttribute("ondragstart", "handleDragStart(event)");
    li.setAttribute("data-task-id", task.id);

    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.title;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-sm btn-warning ms-2 edit-button";
    editBtn.onclick = () => handleEditTask(task.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-sm btn-danger ms-2 delete-button";
    deleteBtn.onclick = () => handleDeleteTask(task.id);

    li.appendChild(titleSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    columns[task.status].appendChild(li);
  });

  // Пустые колонки
  Object.entries(columns).forEach(([status, column]) => {
    if (column.children.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-column";
      emptyMessage.textContent = "Нет задач";
      column.appendChild(emptyMessage);
    }
  });

  // Обновление счетчиков задач
  updateTaskCounts();
}

function handleAddTask(userId) {
  const title = taskInput.value.trim();
  if (!title) return alert("Введите название задачи!");

  const newTask = new Task(title, "backlog", userId);
  Task.save(newTask);

  taskInput.value = "";
  taskInput.classList.add("d-none");
  submitTaskBtn.classList.add("d-none");
  submitTaskBtn.addEventListener("click", () => {
    handleAddTask(appState.currentUser.id);
  });  
  addTaskBtn.classList.remove("d-none");

  renderTasks(userId);
}

const taskInput = document.getElementById("task-input");
const submitTaskBtn = document.getElementById("submit-task-btn");
const addTaskBtn = document.getElementById("add-task-btn");

addTaskBtn.addEventListener("click", () => {
  taskInput.classList.remove("d-none");
  submitTaskBtn.classList.remove("d-none");
  addTaskBtn.classList.add("d-none");
});

submitTaskBtn.addEventListener("click", () => {
  const title = taskInput.value.trim();
  if (!title) return alert("Please enter a task title.");

  const newTask = new Task(title, "backlog", appState.currentUser.id);
  Task.save(newTask);
  taskInput.value = "";
  taskInput.classList.add("d-none");
  submitTaskBtn.classList.add("d-none");
  addTaskBtn.classList.remove("d-none");
  renderTasks(appState.currentUser.id);
});

function handleEditTask(taskId) {
  const tasks = Task.getAllTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const newTitle = prompt("Введите новое название задачи:", task.title);
  if (!newTitle) return;

  task.title = newTitle;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(appState.currentUser.id);
}

function handleDeleteTask(taskId) {
  let tasks = Task.getAllTasks();
  tasks = tasks.filter(task => task.id !== taskId);

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(appState.currentUser.id);
}

function handleSignOut() {
  appState.currentUser = null; // Удаляем текущего пользователя
  navBar.innerHTML = `
    <form id="app-login-form" class="d-flex">
      <input class="form-control me-2" name="login" autocomplete="username" type="text"
             placeholder="Login" aria-label="Login">
      <input class="form-control me-2" name="password" autocomplete="current-password" type="password"
             placeholder="Password" aria-label="Password">
      <button id="app-login-btn" class="btn btn-outline-info" type="submit">Sign In</button>
    </form>
  `;
  document.querySelector("#content").innerHTML = "Please Sign In to see your tasks!";
  document.querySelector("#app-login-form").addEventListener("submit", handleLoginFormSubmit);
}

function handleLoginFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(document.querySelector("#app-login-form"));
  const login = formData.get("login");
  const password = formData.get("password");

  let hasAccess = authUser(login, password);

  if (!hasAccess) {
    alert("Доступ запрещен: Неверный логин или пароль!");
    return;
  }

  navBar.innerHTML = `
    <span class="navbar-text text-light">Здравствуйте, ${appState.currentUser.login}</span>
    <button id="sign-out-btn" class="btn btn-outline-danger ms-3">Sign Out</button>
  `;
  document.querySelector("#content").innerHTML = taskFieldTemplate;

  const userId = appState.currentUser.id;
  renderTasks(userId);

  document.querySelector("#sign-out-btn").addEventListener("click", handleSignOut);
}

function allowDrop(event) {
  event.preventDefault(); // Разрешает сброс элемента в колонку
}

function handleDrop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("taskId");
  const newStatus = event.target.closest(".kanban-column")?.dataset.status;

  if (!taskId || !newStatus) {
    console.error("Ошибка: невозможно обработать задачу.");
    return;
  }

  const tasks = Task.getAllTasks();
  const task = tasks.find(task => task.id === taskId);
  if (!task) {
    console.error("Задача не найдена:", taskId);
    return;
  }

  task.status = newStatus;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(appState.currentUser.id);
}

function handleDragStart(event) {
  event.dataTransfer.setData("taskId", event.target.dataset.taskId); // Сохраняет ID задачи
}

function highlightItem(event) {
  if (event.target.tagName === "LI") {
    event.target.classList.add("hovered");
  }
}

function unhighlightItem(event) {
  if (event.target.tagName === "LI") {
    event.target.classList.remove("hovered");
  }
}

// Добавляем функции в глобальный объект window
window.allowDrop = allowDrop;
window.handleDragStart = handleDragStart;
window.handleDrop = handleDrop;
window.highlightItem = highlightItem;
window.unhighlightItem = unhighlightItem;