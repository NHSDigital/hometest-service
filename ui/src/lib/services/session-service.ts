import sessionStorageService from "@/lib/services/session-storage-service";

export const SESSION_STORAGE_KEYS = {
  authUser: "hometest:auth:user",
  journeyNavigation: "hometest:journey-navigation",
  createOrderAnswers: "hometest:create-order:answers",
  postcodeLookup: "hometest:postcode-lookup",
} as const;

class SessionService {
  rehydrateAuthUser<T>(): T | null {
    return sessionStorageService.rehydrate<T | null>(SESSION_STORAGE_KEYS.authUser, null);
  }

  dehydrateAuthUser<T>(user: T | null): void {
    if (user === null) {
      sessionStorageService.remove(SESSION_STORAGE_KEYS.authUser);
      return;
    }

    sessionStorageService.dehydrate<T>(SESSION_STORAGE_KEYS.authUser, user);
  }

  rehydrateJourneyNavigation<T>(fallback: T): T {
    return sessionStorageService.rehydrate<T>(SESSION_STORAGE_KEYS.journeyNavigation, fallback);
  }

  dehydrateJourneyNavigation<T>(value: T): void {
    sessionStorageService.dehydrate<T>(SESSION_STORAGE_KEYS.journeyNavigation, value);
  }

  clearJourneyNavigation(): void {
    sessionStorageService.remove(SESSION_STORAGE_KEYS.journeyNavigation);
  }

  rehydrateCreateOrderAnswers<T>(fallback: T): T {
    return sessionStorageService.rehydrate<T>(SESSION_STORAGE_KEYS.createOrderAnswers, fallback);
  }

  dehydrateCreateOrderAnswers<T>(value: T): void {
    sessionStorageService.dehydrate<T>(SESSION_STORAGE_KEYS.createOrderAnswers, value);
  }

  clearCreateOrderAnswers(): void {
    sessionStorageService.remove(SESSION_STORAGE_KEYS.createOrderAnswers);
  }

  rehydratePostcodeLookup<T>(fallback: T): T {
    return sessionStorageService.rehydrate<T>(SESSION_STORAGE_KEYS.postcodeLookup, fallback);
  }

  dehydratePostcodeLookup<T>(value: T): void {
    sessionStorageService.dehydrate<T>(SESSION_STORAGE_KEYS.postcodeLookup, value);
  }

  clearPostcodeLookup(): void {
    sessionStorageService.remove(SESSION_STORAGE_KEYS.postcodeLookup);
  }
}

const sessionService = new SessionService();

export default sessionService;
