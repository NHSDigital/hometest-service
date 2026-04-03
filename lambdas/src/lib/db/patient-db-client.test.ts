import { type DBClient } from "./db-client";
import { PatientDbClient } from "./patient-db-client";

const mockQuery = jest.fn();

describe("PatientDbClient", () => {
  let patientDbClient: PatientDbClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const dbClient: DBClient = {
      query: mockQuery,
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    patientDbClient = new PatientDbClient(dbClient);
  });

  describe("get", () => {
    it("should return notify recipient data", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            nhs_number: "1234567890",
            birth_date: "1990-04-20",
          },
        ],
        rowCount: 1,
      });

      const result = await patientDbClient.get("some-mocked-patient-id");

      expect(result).toEqual({
        nhsNumber: "1234567890",
        birthDate: "1990-04-20",
      });
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("patient_mapping"), [
        "some-mocked-patient-id",
      ]);
    });

    it("should throw when patient record does not exist", async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(patientDbClient.get("missing-patient-id")).rejects.toThrow(
        "Failed to fetch notify recipient data",
      );
    });
  });
});
