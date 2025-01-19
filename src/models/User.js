import { BaseModel } from "./BaseModel";
import { getFromStorage, addToStorage } from "../utils";

export class User extends BaseModel {
  constructor(login, password) {
    super();
    this.login = login;
    this.password = password;
  }

  get storageKey() {
    return "users"; // Статическое хранилище для всех пользователей
  }

  get hasAccess() {
    const users = getFromStorage(this.storageKey);
    return users.some(user => user.login === this.login && user.password === this.password);
  }

  static save(user) {
    const storageKey = "users";
    const users = getFromStorage(storageKey);
    if (users.some(existingUser => existingUser.login === user.login)) {
      console.error("User with this login already exists.");
      return;
    }
    users.push(user);
    localStorage.setItem(storageKey, JSON.stringify(users));
  }

  static deleteUser(login) {
    const storageKey = "users";
    let users = getFromStorage(storageKey);
    users = users.filter(user => user.login !== login);
    localStorage.setItem(storageKey, JSON.stringify(users));
  }

  static generateAdmin() {
    const admin = new User("admin", "admin123");
    User.save(admin);
  }

  static findByLogin(login) {
    const storageKey = "users";
    const users = getFromStorage(storageKey);
    return users.find(user => user.login === login) || null;
  }
}