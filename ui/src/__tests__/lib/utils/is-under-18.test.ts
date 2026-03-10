import { isUnder18 } from "@/lib/utils/is-under-18";

// Mock the current date to a fixed point in time for consistent test results
const FIXED_TODAY = new Date(2026, 2, 4);

describe("isUnder18", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(FIXED_TODAY);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should return true for someone under 18", () => {
    const birthdate = "2009-03-05";

    expect(isUnder18(birthdate)).toBe(true);
  });

  it("should return false on their 18th birthday", () => {
    const birthdate = "2008-03-04";

    expect(isUnder18(birthdate)).toBe(false);
  });

  it("should return false when above 18", () => {
    const birthdate = "2008-03-03";

    expect(isUnder18(birthdate)).toBe(false);
  });

  it("should throw for invalid date format", () => {
    const birthdate = "01-01-2000";

    expect(() => isUnder18(birthdate)).toThrow();
  });
});
