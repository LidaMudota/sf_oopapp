export const getFromStorage = function (key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
};

export const addToStorage = function (obj, key) {
  const storageData = getFromStorage(key);
  storageData.push(obj);
  localStorage.setItem(key, JSON.stringify(storageData));
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
    new Task("Task 1", "todo", userId),
    new Task("Task 2", "in-progress", userId),
    new Task("Task 3", "done", userId),
  ];
  sampleTasks.forEach(task => Task.save(task));
  console.log("Тестовые задачи созданы:", sampleTasks); // Для отладки
};