import { BaseModel } from "./BaseModel";
import { getFromStorage, addToStorage } from "../utils";

export class Task extends BaseModel {
  constructor(title, status = "backlog", userId) {
    super();
    this.title = title;
    this.status = status; // backlog, ready, in-progress, finished
    this.userId = userId;
    this.storageKey = "tasks";
  }  

  static getTasksByUserId(userId) {
    const tasks = getFromStorage("tasks"); // Загружаем задачи из хранилища
    return tasks.filter(task => task.userId === userId); // Фильтруем по ID пользователя
  }  

  static save(task) {
    addToStorage(task, task.storageKey);
  }

  static getAllTasks() {
    return getFromStorage("tasks");
  }
}
