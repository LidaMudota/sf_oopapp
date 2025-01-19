import { appState } from "../app"; // Импорт после экспорта
import { User } from "../models/User";

export const authUser = function (login, password) {
  const user = User.findByLogin(login); // Предполагается, что User имеет метод findByLogin
  if (!user || user.password !== password) {
    return false; // Неверный логин или пароль
  }

  appState.currentUser = user;
  appState.currentUser.isAdmin = login === "admin" && password === "admin123";
  console.log("Is Admin:", appState.currentUser.isAdmin); // Логирование после установки
  return true;
};

export const addUser = function (login, password) {
  if (User.findByLogin(login)) {
    alert("User with this login already exists!");
    return;
  }
  const user = new User(login, password);
  User.save(user);
  alert("User added successfully!");
};

export const deleteUser = function (login) {
  const user = User.findByLogin(login);
  if (!user) {
    alert("User not found!");
    return;
  }
  User.deleteUser(login);
  alert("User deleted successfully!");
};