import { BaseModel } from "./BaseModel";
import { getFromStorage } from "../utils";

export class Task extends BaseModel {
  static storageKey = "tasks"; // Сделали ключ статическим

  constructor(title, status = "backlog", userId) {
    super();
    if (!title || !userId) {
      throw new Error("Title and userId are required to create a Task.");
    }
    this.id = crypto.randomUUID(); // Генерируем уникальный ID
    this.title = title;
    this.status = status; // backlog, ready, in-progress, finished
    this.userId = userId;
  }

  static getTasksByUserId(userId) {
    const tasks = getFromStorage(this.storageKey) || [];
    return tasks.filter(task => task.userId === userId);
  }

  static getAllTasks() {
    return getFromStorage(this.storageKey) || [];
  }

  static save(task) {
    if (!(task instanceof Task)) {
      throw new Error("Only Task instances can be saved.");
    }
    const tasks = this.getAllTasks();
    tasks.push(task);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  static update(taskId, updatedData) {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    if (index === -1) {
      throw new Error("Task not found.");
    }
    tasks[index] = { ...tasks[index], ...updatedData };
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  static delete(taskId) {
    const tasks = this.getAllTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredTasks));
  }
}