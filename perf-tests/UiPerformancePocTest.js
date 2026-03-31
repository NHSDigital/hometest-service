import { check, sleep } from "k6";
import { browser } from "k6/browser";
import exec from "k6/execution";

const targetUrl = "http://localhost:3000/";
const loginEmail = "testuserlive+12@demo.signin.nhs.uk";
const loginPassword = "Passw0rd$1";
const loginOtp = "190696";

const headingTimeoutMs = 15000;
const elementTimeoutMs = 15000;

// const emails = [
//   "testuserlive+12@demo.signin.nhs.uk",
//   "testuserlive+9@demo.signin.nhs.uk",
//   //"testuserlive+16@demo.signin.nhs.uk",
// ];

// const maxUsage = 5;
// const totalAllowed = emails.length * maxUsage;

// function getEmail() {
//   const i = exec.scenario.iterationInTest;

//   if (i >= totalAllowed) {
//     throw new Error(`No emails left (each used ${maxUsage} times). i=${i}`);
//   }
//   return emails[Math.floor(i / maxUsage)];
// }

export const options = {
  scenarios: {
    ui: {
      executor: "shared-iterations",
      vus: 5,
      iterations: 5,
      maxDuration: "1m",
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
  },
};

// Helpers
function isNhsLoginUrl(url) {
  return (
    url.includes("signin.nhs.uk") ||
    url.includes("api.sandpit.signin.nhs.uk") ||
    url.includes("/login") ||
    url.includes("/oauth") ||
    url.includes("authorize")
  );
}
async function clickButtonByText(page, text) {
  const btn = page.locator(`//button[normalize-space()="${text}"]`);
  await btn.waitFor({ state: "visible", timeout: elementTimeoutMs });
  await btn.click();
}

export default async function () {
  const page = await browser.newPage();

  try {
    // 1) Navigate to app
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    check(response, {
      "navigation returned a response": (r) => r !== null,
      "response status is 2xx/3xx": (r) => r !== null && r.status() >= 200 && r.status() < 400,
    });

    // 2) Email input
    const emailInput = page.locator("input#user-email");
    await emailInput.waitFor({ state: "visible", timeout: elementTimeoutMs });
    await emailInput.fill(loginEmail);
    // console.log(
    //   `VU=${exec.vu.idInTest} globalIter=${exec.scenario.iterationInTest} Using email: ${loginEmail}`,
    // );
    // 3) Password input
    const passwordInput = page.locator("input#password-input");
    await passwordInput.waitFor({ state: "visible", timeout: elementTimeoutMs });
    await passwordInput.fill(loginPassword);

    sleep(1);

    // 4) Click Continue (submit credentials)
    await clickButtonByText(page, "Continue");

    // 5) Wait for OTP input to appear
    const otpInput = page.locator("#otp-input");
    await otpInput.waitFor({ state: "visible", timeout: elementTimeoutMs });

    // 6) Fill OTP and Continue
    await otpInput.fill(loginOtp);
    sleep(1);
    await clickButtonByText(page, "Continue");
    sleep(1);

    await page.waitForURL(/localhost:3000/, { timeout: 20000 });

    // 7) Validate final URL

    check(page.url(), {
      "ended up on app domain": (url) => url.includes("localhost:3000"),
    });

    // 8) Check h1 exists and has text
    const heading = page.locator("h1");
    await heading.waitFor({ state: "visible", timeout: headingTimeoutMs });
    const headingText = await heading.textContent();

    check(headingText, {
      "page has visible non-empty h1": (text) => typeof text === "string" && text.trim().length > 0,
    });

    sleep(5);
  } finally {
    //await page.close();
  }
}
