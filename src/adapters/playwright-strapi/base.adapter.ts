import { chromium, Page } from "@playwright/test";
import { logger } from "../../utils/logger";

export class PlaywrightBaseProductAdapter {
  protected page: Page = null;
  protected pageURL: string;

  private userCredentials: {
    username: string;
    password: string;
  };

  protected async goToItsPage() {
    await this.page.goto(this.pageURL);
  }

  public static async init<T extends PlaywrightBaseProductAdapter>(
    this: new () => T,
    properties: {
      pageURL: string;
      credentials: { email: string; password: string };
    },
  ): Promise<T> {
    const instance = new this();

    instance.userCredentials = {
      username: properties.credentials.email,
      password: properties.credentials.password,
    };

    await instance.setupPage(properties.pageURL);
    logger.debug({ pageURL: properties.pageURL }, "Adapter initialized");
    return instance;
  }

  private async setupPage(baseURL: string): Promise<void> {
    this.pageURL = baseURL;
    const headless = process.env.PLAYWRIGHT_HEADLESS === "true";
    logger.debug({ baseURL, headless }, "Launching browser");
    const browser = await chromium.launch({
      headless,
    });
    this.page = await browser.newPage({
      baseURL,
    });
  }

  private async isUserLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => {
      return localStorage.getItem("isLoggedIn");
    });

    logger.debug({ hasToken: !!token }, "Checked localStorage for login state");
    return !!token;
  }

  private async login(email: string, password: string): Promise<void> {
    const maxRetries = 3;
    const rateLimitDelay = Number(process.env.LOGIN_RATE_LIMIT_DELAY_MS) || 60000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info({ attempt, maxRetries }, "Login attempt");
      logger.debug("Navigating to /admin");
      await this.page.goto("/admin");
      await this.page.waitForLoadState("networkidle");

      logger.debug("Filling login form");
      await this.page.getByLabel("Email").fill(email);
      await this.page.getByLabel("Password").fill(password);

      logger.debug("Submitting login form");
      await this.page.getByText("Login").click();

      const rateLimitError = this.page.getByText("Too many requests, please try again later.");
      const invalidCredentials = this.page.getByText("Invalid credentials");

      const result = await Promise.race([
        this.page.waitForURL("**/admin").then(() => "success" as const),
        rateLimitError.waitFor({ state: "visible", timeout: 5000 }).then(() => "rate-limit" as const),
        invalidCredentials.waitFor({ state: "visible", timeout: 5000 }).then(() => "invalid-credentials" as const),
      ]);

      logger.debug({ result }, "Login outcome");

      if (result === "success") {
        logger.info("Login successful");
        return;
      }

      if (result === "rate-limit") {
        if (attempt === maxRetries) throw new Error("Login failed: rate limited after max retries");
        logger.warn({ attempt, delayMs: rateLimitDelay }, "Rate limited, waiting before retry");
        await this.page.waitForTimeout(rateLimitDelay);
        continue;
      }

      if (result === "invalid-credentials") {
        if (attempt === maxRetries) throw new Error("Login failed: invalid credentials after max retries");
        logger.warn({ attempt }, "Invalid credentials, retrying");
        continue;
      }
    }
  }

  protected async dismissGuidedTour(): Promise<void> {
    const dialog = this.page.locator("[role='dialog'][aria-labelledby='guided-tour-title']");
    try {
      await dialog.waitFor({ state: "visible", timeout: 1500 });
      logger.debug("Guided tour detected, dismissing");
      await dialog.getByRole("button", { name: "Skip" }).click({ force: true });
      await this.page.waitForLoadState("networkidle");
    } catch {
      logger.debug("No guided tour modal found");
    }
  }

  protected async ensureLoggedIn(): Promise<void> {
    logger.info("Checking login state");
    await this.page.goto("/admin");
    await this.page.waitForLoadState("networkidle");

    const loggedIn = await this.isUserLoggedIn();

    if (loggedIn) {
      logger.info("Already logged in");
      return;
    }

    logger.info("Not logged in, starting login flow");
    await this.login(this.userCredentials.username, this.userCredentials.password);

    const confirmed = await this.isUserLoggedIn();
    if (!confirmed) {
      throw new Error("Login attempt failed");
    }
  }
}
