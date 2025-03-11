import { appState } from "../app";
import { User } from "../models/User";
import { getFromStorage } from "../utils";

export const authUser = (login, password) => {
  // Получаем список пользователей из localStorage по ключу "users"
  const users = getFromStorage("users");

  // Ищем пользователя с указанными логином и паролем
  const foundUser = users.find(u => u.login === login && u.password === password);
  if (!foundUser) return false;

  // Создаём нового пользователя, передавая роль из найденного объекта
  const user = new User(foundUser.login, foundUser.password, foundUser.role);
  appState.currentUser = user;

  return true;
};
