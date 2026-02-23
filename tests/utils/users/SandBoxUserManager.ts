import { BaseUserManager } from "./BaseUserManager";
import { ConfigFactory } from "../../configuration/configuration";
import type { NHSLoginUser } from "./BaseUser";
import NhsLoginHelper from "../../page-objects/NhsLoginHelper";
import type { Page } from "@playwright/test";

export class SandBoxUserManager extends BaseUserManager<NHSLoginUser> {
  public getWorkerUsers(): NHSLoginUser[] {
    const env = ConfigFactory.getEnvironment();

    // Use local user from users.ts for local environment (gitignored file)
    if (env === "local") {
      try {
        // it could be refactored to await import but getWorkerUsers cannot be invoked in constructor
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { localUser } = require("../../users");
        console.log("Using local environment user from users.ts");
        return [localUser];
      } catch (error) {
        console.error(
          "Error loading users.ts. Please create users.ts file with your local user details.",
        );
        throw new Error(
          "users.ts file not found. Please create it based on users.ts.example",
          { cause: error },
        );
      }
    }

    // Use hardcoded users for dev/staging environments
    console.log("Using dev/staging environment user configuration");
    return [
      {
        email: "testuserlive@demo.signin.nhs.uk",
        nhsNumber: "9686368973",
        odsCode: "C83615",
        age: 49,
        dob: "1968-02-12",
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: "eligible user",
        patientId: "49f470a1-cc52-49b7-beba-0f9cec937c46",
      },
      {
        email: "testuserlive+1@demo.signin.nhs.uk",
        nhsNumber: "9686368906",
        odsCode: "C83615",
        age: 52,
        dob: "1942-02-01",
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: "eligible user",
        patientId: "27f8926b-1fa8-4c54-b37e-e146223687cf",
      },
      {
        email: "testuserlive+3@demo.signin.nhs.uk",
        nhsNumber: "9658218873",
        odsCode: "A20047",
        age: 40,
        dob: "1927-06-19",
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: "eligible user",
        patientId: "f385a33a-eb3c-47f3-af37-b3e099c7ef91",
      },
      {
        email: "testuserlive+6@demo.signin.nhs.uk",
        nhsNumber: "9658218989",
        odsCode: "A20047",
        age: 45,
        dob: "1918-09-19",
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: "eligible user",
        patientId: "eb9f344f-4204-4b68-a539-2c35c3852108",
      },
    ];
  }

  protected async loginWorkerUser(
    user: NHSLoginUser,
    page: Page,
  ): Promise<Page> {
    console.log(`Logging in the user : ${user.email} (${user.nhsNumber})`);
    const loginHelper = new NhsLoginHelper();
    return await loginHelper.loginNhsUser(page, user);
  }
}
