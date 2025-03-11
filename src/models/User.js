import { BaseModel } from "./BaseModel";
import { getFromStorage, addToStorage } from "../utils";

export class User extends BaseModel {
  constructor(login, password, role = "user") {
    super();
    this.login = login;
    this.password = password;
    this.role = role; // Роль: "user" или "admin"
    this.storageKey = "users";
  }

  get hasAccess() {
    const users = getFromStorage(this.storageKey);
    if (users.length === 0) {
      return false;
    }
    for (const user of users) {
      if (user.login === this.login && user.password === this.password) {
        return true;
      }
    }
    return false;
  }

  static save(user) {
    try {
      addToStorage(user, user.storageKey);
      return true;
    } catch (error) {
      throw new Error(error);
    }
  }
}