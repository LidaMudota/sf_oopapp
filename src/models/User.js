import { BaseModel } from "./BaseModel";
import { getFromStorage, addToStorage } from "../utils";

export class User extends BaseModel {
  constructor(login, password) {
    super();
    this.login = login;
    this.password = password;
    this.storageKey = "users";
  }

  get hasAccess() {
    let users = getFromStorage(this.storageKey);
    if (users.length == 0) return false;
    for (let user of users) {
      if (user.login == this.login && user.password == this.password)
        return true;
    }
    return false;
  }

  static save(user) {
    try {
      addToStorage(user, user.storageKey);
      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  static generateAdmin() {
    const admin = new User("admin", "admin123");
    User.save(admin);
  }

  static deleteUser(login) {
    let users = getFromStorage("users");
    users = users.filter(user => user.login !== login);
    localStorage.setItem("users", JSON.stringify(users));
  }  
}