import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "./styles/style.css";
import taskFieldTemplate from "./templates/taskField.html";
import { User } from "./models/User";
import { generateTestUser, getTasksFromStorage, saveTasksToStorage } from "./utils";
import { State } from "./state";
import { authUser } from "./services/auth";
import Task from "./models/Task.js";

window.addEventListener("beforeunload", () => {
  localStorage.removeItem("currentUser");
});

// Инициализация панелей
document.getElementById("adminPanel").style.display = "none";
document.getElementById("userManagementPanel").style.display = "none";

// ************ СОЗДАЁМ ГЛОБАЛЬНОЕ СОСТОЯНИЕ ************
export const appState = new State();
appState.selectedUser = null; // Добавлено поле для хранения выбранного пользователя

generateTestUser(User);

// ************ ОБРАБОТКА ФОРМЫ ВХОДА ************
const loginForm = document.querySelector("#app-login-form");

// HTML-разметка формы входа для восстановления при Sign Out
const loginFormHtml = `
  <input class="form-control me-2" name="login" autocomplete="username" type="text" placeholder="Login" aria-label="Login">
  <input class="form-control me-2" name="password" autocomplete="current-password" type="password" placeholder="Password" aria-label="Password">
  <button id="app-login-btn" class="btn btn-outline-info" type="submit">Sign In</button>
`;

function loginSubmitHandler(e) {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const login = formData.get("login");
  const password = formData.get("password");

  // Авторизуемся
  if (authUser(login, password)) {
    const user = appState.currentUser; // Пользователь, прошедший проверку

    // Сохраняем данные пользователя в localStorage
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        login: user.login,
        password: user.password,
        role: user.role || "user",
      })
    );

    // Заменяем форму на меню пользователя
    loginForm.removeEventListener("submit", loginSubmitHandler);
    loginForm.innerHTML = `
      <div class="user-menu">
        <button id="userMenuButton" class="btn btn-outline-info" type="button">
          ${login} <span id="menuArrow">▼</span>
        </button>
        <ul id="userDropdown" class="dropdown-menu">
          <li><a href="#" id="myAccountLink">My Account</a></li>
          <li><a href="#" id="myTasksLink">My Tasks</a></li>
          <li><a href="#" id="logoutLink">Log Out</a></li>
        </ul>
      </div>
    `;
    setupUserMenu();

    // Подключаем шаблон доски задач
    document.querySelector("#content").innerHTML = taskFieldTemplate;
    document.getElementById("addTaskBtn").addEventListener("click", toggleTaskInput);

    // Назначаем обработчики для кнопок перемещения задач
    document.getElementById("readyAddCardBtn").addEventListener("click", () => {
      showDropdown("Backlog", "Ready", "ready-column", "readyAddCardBtn");
    });
    document.getElementById("inprogressAddCardBtn").addEventListener("click", () => {
      showDropdown("Ready", "In Progress", "inprogress-column", "inprogressAddCardBtn");
    });
    document.getElementById("finishedAddCardBtn").addEventListener("click", () => {
      showDropdown("In Progress", "Finished", "finished-column", "finishedAddCardBtn");
    });

    // Если администратор, показываем панель управления
    if (user.role === "admin") {
      document.getElementById("adminPanel").style.display = "block";
      const addUserBtn = document.getElementById("addUserBtn");
      addUserBtn.addEventListener("click", addUser);

      setTimeout(() => {
        showAdminUserSelect();
        renderBoard();
      }, 0);
    } else {
      renderBoard();
    }
  } else {
    alert("Доступ запрещен");
  }
}

function signOutHandler() {
  // Сброс состояния пользователя
  appState.currentUser = null;
  localStorage.removeItem("currentUser");

  // Скрываем админ-панель и панель управления
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("userManagementPanel").style.display = "none";

  // Восстанавливаем форму входа
  loginForm.innerHTML = loginFormHtml;
  loginForm.addEventListener("submit", loginSubmitHandler);

  // Сбрасываем содержимое страницы
  document.querySelector("#content").innerHTML = "Please Sign In to see your tasks!";

  // Перезагружаем страницу
  window.location.reload();
}

loginForm.addEventListener("submit", loginSubmitHandler);

function setupUserMenu() {
  const userMenuButton = document.getElementById("userMenuButton");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener("click", () => {
      if (userDropdown.style.display === "block") {
        userDropdown.style.display = "none";
        document.getElementById("menuArrow").textContent = "▼";
      } else {
        userDropdown.style.display = "block";
        document.getElementById("menuArrow").textContent = "▲";
      }
    });
  }

  // Обработчик для "My Account"
  const myAccountLink = document.getElementById("myAccountLink");
  if (myAccountLink) {
    myAccountLink.addEventListener("click", (e) => {
      e.preventDefault();
      userDropdown.style.display = "none";
      document.getElementById("menuArrow").textContent = "▼";
      showMyAccount();
    });
  }

  // Обработчик для "My Tasks"
  const myTasksLink = document.getElementById("myTasksLink");
  if (myTasksLink) {
    myTasksLink.addEventListener("click", (e) => {
      e.preventDefault();
      userDropdown.style.display = "none";
      document.getElementById("menuArrow").textContent = "▼";
      document.getElementById("myAccountPanel").style.display = "none";
      renderBoard();
    });
  }

  // Обработчик для "Log Out"
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      signOutHandler();
    });
  }
}

document.getElementById("adminPanel").style.display = "none";

// Если пользователь уже сохранён
const savedUser = JSON.parse(localStorage.getItem("currentUser"));
if (savedUser && savedUser.role === "admin") {
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("userManagementPanel").style.display = "none";
  const addUserBtn = document.getElementById("addUserBtn");
  addUserBtn.addEventListener("click", addUser);
  const manageBtn = document.getElementById("manageUsersBtn");
  const userPanel = document.getElementById("userManagementPanel");
  manageBtn.addEventListener("click", () => {
    userPanel.style.display =
      (!userPanel.style.display || userPanel.style.display === "none") ? "block" : "none";
    if (userPanel.style.display === "block") renderUserList();
  });
  showAdminUserSelect();
  renderBoard();
} else {
  renderBoard();
}

// ************ ФУНКЦИИ РАБОТЫ С ЗАДАЧАМИ ************
function startEditTask(taskEl, taskId) {
  const tasks = getTasksFromStorage();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser.role !== "admin" && currentUser.login !== task.owner) {
    alert("У вас нет прав для редактирования этой задачи!");
    return;
  }

  const titleSpan = taskEl.querySelector("span");
  titleSpan.style.display = "none";

  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.value = task.title;
  inputEl.classList.add("task-edit");

  taskEl.insertBefore(inputEl, titleSpan);
  inputEl.focus();

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finishEdit();
  });
  inputEl.addEventListener("blur", finishEdit);

  function finishEdit() {
    const newTitle = inputEl.value.trim();
    if (newTitle) {
      task.title = newTitle;
      saveTasksToStorage(tasks);
    }
    currentUser.role === "admin"
      ? renderBoard(appState.selectedUser)
      : renderBoard();
  }
}

function deleteTask(taskId) {
  let tasks = getTasksFromStorage();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser.role !== "admin" && currentUser.login !== task.owner) {
    alert("У вас нет прав для удаления этой задачи!");
    return;
  }

  tasks = tasks.filter(t => t.id !== taskId);
  saveTasksToStorage(tasks);

  currentUser.role === "admin"
    ? renderBoard(appState.selectedUser)
    : renderBoard();
}

function renderBoard(selectedUser = null) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    document.getElementById("content").innerHTML = "Please Sign In to see your tasks!";
    return;
  }

  const requiredElements = [
    "backlog-list",
    "ready-list",
    "inprogress-list",
    "finished-list",
    "activeCount",
    "finishedCount",
  ];
  for (const id of requiredElements) {
    if (!document.getElementById(id)) {
      console.warn("Kanban board is not present in the DOM, skipping renderBoard()");
      return;
    }
  }

  let tasks = getTasksFromStorage();
  if (currentUser.role === "admin") {
    if (!selectedUser) selectedUser = currentUser.login;
    tasks = tasks.filter(task => task.owner === selectedUser);
  } else {
    tasks = tasks.filter(task => task.owner === currentUser.login);
  }

  document.getElementById("backlog-list").innerHTML = "";
  document.getElementById("ready-list").innerHTML = "";
  document.getElementById("inprogress-list").innerHTML = "";
  document.getElementById("finished-list").innerHTML = "";

  tasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.setAttribute("draggable", "true");
    taskEl.dataset.id = task.id;

    let displayText = task.title;
    if (currentUser.role === "admin") {
      displayText += ` [${task.owner}]`;
    }

    const titleSpan = document.createElement("span");
    titleSpan.textContent = displayText;
    taskEl.appendChild(titleSpan);

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.className = "edit-btn";
    editBtn.onclick = () => startEditTask(taskEl, task.id);
    taskEl.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => deleteTask(task.id);
    taskEl.appendChild(delBtn);

    taskEl.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", task.id);
      e.currentTarget.classList.add("dragging");
    });
    taskEl.addEventListener("dragend", (e) => {
      e.currentTarget.classList.remove("dragging");
    });

    if (task.status === "Backlog") {
      document.getElementById("backlog-list").appendChild(taskEl);
    } else if (task.status === "Ready") {
      document.getElementById("ready-list").appendChild(taskEl);
    } else if (task.status === "In Progress") {
      document.getElementById("inprogress-list").appendChild(taskEl);
    } else if (task.status === "Finished") {
      document.getElementById("finished-list").appendChild(taskEl);
    }
  });

  ["backlog-list", "ready-list", "inprogress-list", "finished-list"].forEach(listId => {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    listEl.addEventListener("dragover", (e) => e.preventDefault());
    listEl.addEventListener("dragenter", (e) => e.currentTarget.classList.add("drop-zone"));
    listEl.addEventListener("dragleave", (e) => e.currentTarget.classList.remove("drop-zone"));
    listEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("drop-zone");
      const taskId = e.dataTransfer.getData("text");
      const newStatus = e.currentTarget.dataset.status;
      moveTask(parseInt(taskId), newStatus);
    });
  });

  const activeCount = tasks.filter(t => t.status !== "Finished").length;
  const finishedCount = tasks.filter(t => t.status === "Finished").length;
  document.getElementById("activeCount").textContent = activeCount;
  document.getElementById("finishedCount").textContent = finishedCount;

  let backlogTasks = getTasksFromStorage().filter(task => task.status === "Backlog");
  if (currentUser.role === "admin") {
    backlogTasks = appState.selectedUser
      ? backlogTasks.filter(t => t.owner === appState.selectedUser)
      : backlogTasks.filter(t => t.owner === currentUser.login);
  } else {
    backlogTasks = backlogTasks.filter(t => t.owner === currentUser.login);
  }
  document.getElementById("readyAddCardBtn").disabled = backlogTasks.length === 0;

  let readyTasks = getTasksFromStorage().filter(task => task.status === "Ready");
  if (currentUser.role === "admin") {
    readyTasks = appState.selectedUser
      ? readyTasks.filter(t => t.owner === appState.selectedUser)
      : readyTasks.filter(t => t.owner === currentUser.login);
  } else {
    readyTasks = readyTasks.filter(t => t.owner === currentUser.login);
  }
  document.getElementById("inprogressAddCardBtn").disabled = readyTasks.length === 0;

  let inProgressTasks = getTasksFromStorage().filter(task => task.status === "In Progress");
  if (currentUser.role === "admin") {
    inProgressTasks = appState.selectedUser
      ? inProgressTasks.filter(t => t.owner === appState.selectedUser)
      : inProgressTasks.filter(t => t.owner === currentUser.login);
  } else {
    inProgressTasks = inProgressTasks.filter(t => t.owner === currentUser.login);
  }
  document.getElementById("finishedAddCardBtn").disabled = inProgressTasks.length === 0;
}

function moveTask(taskId, newStatus) {
  const tasks = getTasksFromStorage();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = newStatus;
  saveTasksToStorage(tasks);
  renderBoard(appState.selectedUser);
}

let isAddingTask = false;
let blurHandlerBound = false;

function toggleTaskInput() {
  const newTaskInput = document.getElementById("newTaskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("No user is logged in!");
    return;
  }

  function submitTask() {
    const title = newTaskInput.value.trim();
    if (title) {
      const tasks = getTasksFromStorage();
      const newId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      let owner = currentUser.login;
      if (currentUser.role === "admin" && appState.selectedUser) {
        owner = appState.selectedUser;
      }
      tasks.push(new Task(newId, title, "Backlog", owner));
      saveTasksToStorage(tasks);
      currentUser.role === "admin"
        ? renderBoard(appState.selectedUser)
        : renderBoard();
    }
    newTaskInput.value = "";
    newTaskInput.style.display = "none";
    addTaskBtn.textContent = "+ Add card";
    isAddingTask = false;
    newTaskInput.removeEventListener("blur", submitTask);
    blurHandlerBound = false;
  }

  if (!isAddingTask) {
    newTaskInput.style.display = "inline-block";
    addTaskBtn.textContent = "Submit";
    isAddingTask = true;
    if (!blurHandlerBound) {
      newTaskInput.addEventListener("blur", submitTask);
      blurHandlerBound = true;
    }
  } else {
    submitTask();
  }
}

function showDropdown(sourceStatus, targetStatus, columnId, buttonId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let tasks = getTasksFromStorage().filter(task => task.status === sourceStatus);

  if (currentUser.role === "admin") {
    tasks = appState.selectedUser
      ? tasks.filter(t => t.owner === appState.selectedUser)
      : tasks.filter(t => t.owner === currentUser.login);
  } else {
    tasks = tasks.filter(t => t.owner === currentUser.login);
  }

  if (!tasks.length) {
    alert(`Нет задач со статусом "${sourceStatus}"`);
    return;
  }

  const selectEl = document.createElement("select");
  selectEl.id = `${targetStatus}-dropdown`;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Выберите задачу --";
  selectEl.appendChild(defaultOption);

  tasks.forEach(task => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.title;
    selectEl.appendChild(option);
  });

  const columnEl = document.getElementById(columnId);
  const addCardBtn = document.getElementById(buttonId);
  columnEl.insertBefore(selectEl, addCardBtn);

  selectEl.addEventListener("change", (e) => {
    const selectedTaskId = e.target.value;
    if (selectedTaskId) {
      moveTask(parseInt(selectedTaskId), targetStatus);
      selectEl.remove();
    }
  });
}

function showMyAccount() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  document.getElementById("accountLogin").textContent = currentUser.login;
  document.getElementById("accountRole").textContent = currentUser.role;
  document.getElementById("myAccountPanel").style.display = "block";
}

document.getElementById("closeMyAccountBtn").addEventListener("click", () => {
  document.getElementById("myAccountPanel").style.display = "none";
});

// Экспортируем для шаблона (taskField.html)
window.addTask = toggleTaskInput;

// ************ ПАНЕЛЬ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ (АДМИН) ************
function renderUserList() {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const listEl = document.getElementById("userList");
  if (!listEl) return;

  listEl.innerHTML = "";
  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.login} (${user.role})`;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.login !== user.login) {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.onclick = () => removeUser(user.login);
      li.appendChild(removeBtn);
    }
    listEl.appendChild(li);
  });
}

function addUser() {
  const usernameField = document.getElementById("newUsername");
  const passwordField = document.getElementById("newPassword");
  const roleField = document.getElementById("newUserRole");
  if (!usernameField || !passwordField || !roleField) return;

  console.log("addUser вызвана");

  const username = usernameField.value.trim();
  const password = passwordField.value;
  const role = roleField.value;

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some(u => u.login === username)) {
    alert("User already exists");
    return;
  }

  const newUser = { login: username, password, role };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  usernameField.value = "";
  passwordField.value = "";
  roleField.value = "user";

  renderUserList();
  showAdminUserSelect();
}

window.addUser = addUser;

function removeUser(username) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  users = users.filter(u => u.login !== username);
  localStorage.setItem("users", JSON.stringify(users));
  renderUserList();
  showAdminUserSelect();
}

const manageBtn = document.getElementById("manageUsersBtn");
const userPanel = document.getElementById("userManagementPanel");
if (manageBtn && userPanel) {
  manageBtn.addEventListener("click", () => {
    userPanel.style.display =
      (userPanel.style.display === "none" || userPanel.style.display === "")
        ? "block"
        : "none";
    if (userPanel.style.display === "block") renderUserList();
  });
}

function showAdminUserSelect() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") return;

  const adminUserSelectContainer = document.getElementById("admin-user-select-container");
  if (!adminUserSelectContainer) return;

  const adminUserSelect = document.getElementById("adminUserSelect");
  adminUserSelectContainer.style.display = "block";
  adminUserSelect.innerHTML = '<option value="">-- Select user --</option>';

  const users = JSON.parse(localStorage.getItem("users")) || [];
  users.forEach(user => {
    if (user.login !== currentUser.login) {
      const opt = document.createElement("option");
      opt.value = user.login;
      opt.textContent = user.login;
      adminUserSelect.appendChild(opt);
    }
  });

  adminUserSelect.addEventListener("change", (e) => {
    appState.selectedUser = e.target.value;
    renderBoard(appState.selectedUser);
  });
}
