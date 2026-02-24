export class StorageManager {
  static save(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static load<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    try {
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }
}
