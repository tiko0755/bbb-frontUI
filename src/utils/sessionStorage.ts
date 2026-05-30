interface SessionStorageUtil {
  set(key: string, value: any): void;
  get(key: string): any;
  remove(key: string): void;
  clear(): void;
}

export const session: SessionStorageUtil = {
  set(key: string, value: any): void {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    sessionStorage.setItem(key, value);
  },
  get(key: string): any {
    const data = sessionStorage.getItem(key);
    if (data === null) {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  },
  remove(key: string): void {
    sessionStorage.removeItem(key);
  },
  clear(): void {
    sessionStorage.clear();
  },
};
