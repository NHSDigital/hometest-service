class SessionStorageService {
  private isAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  }

  rehydrate<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) {
      return fallback;
    }

    const rawValue = window.sessionStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      this.remove(key);
      return fallback;
    }
  }

  dehydrate<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      return;
    }

    window.sessionStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (!this.isAvailable()) {
      return;
    }

    window.sessionStorage.removeItem(key);
  }
}

const sessionStorageService = new SessionStorageService();

export default sessionStorageService;
