export const getFromStorage = function (key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
};

export const addToStorage = function (key, value) {
  const existing = getFromStorage(key);
  existing.push(value);
  localStorage.setItem(key, JSON.stringify(existing));
};

export const generateTestUser = function (User) {
  localStorage.clear(); // Очищаем локальное хранилище перед созданием тестовых данных
  const testUser = new User("test", "qwerty123");
  User.save(testUser);
  console.log("Тестовый пользователь создан:", testUser); // Для отладки
  return testUser; // Возвращаем созданного пользователя
};

export const generateTestTasks = function (Task, userId) {
  const sampleTasks = [
    new Task("Task 1", "backlog", userId),
    new Task("Task 2", "ready", userId),
    new Task("Task 3", "in-progress", userId),
  ];
  sampleTasks.forEach(task => Task.save(task));
};