export const getFromStorage = (key) => {
  return JSON.parse(localStorage.getItem(key) || "[]");
};

export const addToStorage = (obj, key) => {
  const storageData = getFromStorage(key);

  // Если добавляем пользователя, проверяем наличие дубликата по логину
  if (key === "users") {
    const duplicate = storageData.find(item => item.login === obj.login);
    if (duplicate) return; // Пользователь уже существует, выходим
  }

  storageData.push(obj);
  localStorage.setItem(key, JSON.stringify(storageData));
};

export const generateTestUser = (User) => {

  const users = getFromStorage("users");

  if (!users.some(u => u.login === "test")) {
    const testUser = new User("test", "qwerty123"); // обычный пользователь
    User.save(testUser);
  }

  if (!users.some(u => u.login === "admin")) {
    const adminUser = new User("admin", "admin123", "admin"); // администратор
    User.save(adminUser);
  }
};

export function getTasksFromStorage() {
  const tasksData = localStorage.getItem("tasks");
  return tasksData ? JSON.parse(tasksData) : [];
}

export function saveTasksToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}