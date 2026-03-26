import sessionService, { SESSION_STORAGE_KEYS } from "@/lib/services/session-service";

describe("SessionService", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe("auth user", () => {
    it("rehydrates null when no auth user exists", () => {
      expect(sessionService.rehydrateAuthUser()).toBeNull();
    });

    it("dehydrates and rehydrates auth user", () => {
      const user = {
        sub: "test-user",
        nhsNumber: "1234567890",
      };

      sessionService.dehydrateAuthUser(user);

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.authUser)).toBe(
        JSON.stringify(user),
      );
      expect(sessionService.rehydrateAuthUser<typeof user>()).toEqual(user);
    });

    it("clears auth user when null is provided", () => {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEYS.authUser,
        JSON.stringify({ sub: "existing" }),
      );

      sessionService.dehydrateAuthUser(null);

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.authUser)).toBeNull();
    });
  });

  describe("journey navigation", () => {
    it("rehydrates fallback when no navigation state exists", () => {
      const fallback = {
        stepHistory: ["/get-self-test-kit-for-hiv"],
        returnToStep: null,
      };

      expect(sessionService.rehydrateJourneyNavigation(fallback)).toEqual(fallback);
    });

    it("dehydrates and clears journey navigation state", () => {
      const navigation = {
        stepHistory: ["/get-self-test-kit-for-hiv", "enter-mobile-number"],
        returnToStep: null,
      };

      sessionService.dehydrateJourneyNavigation(navigation);

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.journeyNavigation)).toBe(
        JSON.stringify(navigation),
      );

      sessionService.clearJourneyNavigation();

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.journeyNavigation)).toBeNull();
    });
  });

  describe("create order answers", () => {
    it("rehydrates fallback when no create order answers exist", () => {
      const fallback = {};

      expect(sessionService.rehydrateCreateOrderAnswers(fallback)).toEqual(fallback);
    });

    it("dehydrates and clears create order answers", () => {
      const answers = {
        postcodeSearch: "SW1A 1AA",
        mobileNumber: "07700900123",
      };

      sessionService.dehydrateCreateOrderAnswers(answers);

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.createOrderAnswers)).toBe(
        JSON.stringify(answers),
      );

      sessionService.clearCreateOrderAnswers();

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.createOrderAnswers)).toBeNull();
    });
  });

  describe("postcode lookup", () => {
    it("rehydrates fallback when no postcode lookup exists", () => {
      const fallback = {
        postcode: "",
        addresses: [],
        selectedAddress: null,
        lookupResultsStatus: "idle",
        error: null,
      };

      expect(sessionService.rehydratePostcodeLookup(fallback)).toEqual(fallback);
    });

    it("dehydrates and clears postcode lookup", () => {
      const postcodeLookup = {
        postcode: "SW1A 1AA",
        addresses: [
          {
            id: "1",
            fullAddress: "10 Downing Street, London, SW1A 2AA",
          },
        ],
        selectedAddress: null,
        lookupResultsStatus: "found",
        error: null,
      };

      sessionService.dehydratePostcodeLookup(postcodeLookup);

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.postcodeLookup)).toBe(
        JSON.stringify(postcodeLookup),
      );

      sessionService.clearPostcodeLookup();

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.postcodeLookup)).toBeNull();
    });
  });
});
