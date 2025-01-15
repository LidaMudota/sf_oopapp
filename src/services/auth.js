import { appState } from "../app";
import { User } from "../models/User";

export const authUser = function (login, password) {
  const user = new User(login, password);
  if (!user.hasAccess) return false;
  appState.currentUser = user;
  appState.currentUser.isAdmin = login === "admin" && password === "admin123";
  return true;
};

console.log("Is Admin:", appState.currentUser?.isAdmin);

export const addUser = function (login, password) {
  const user = new User(login, password);
  User.save(user);
};

export const deleteUser = function (login) {
  User.deleteUser(login);
};