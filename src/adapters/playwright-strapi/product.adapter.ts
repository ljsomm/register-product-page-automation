import { Product } from "../../domain/entity/product.entity";
import { IProductWritePort } from "../../ports/out/product-write.port";
import { logger } from "../../utils/logger";
import { PlaywrightBaseProductAdapter } from "./base.adapter";

export class PlaywrightProductAdapter extends PlaywrightBaseProductAdapter implements IProductWritePort {
  public async saveAll(products: Array<Product>): Promise<void> {
    logger.info({ count: products.length }, "Starting product registration");
    await this.ensureLoggedIn();

    for (const [index, product] of products.entries()) {
      logger.info({ index: index + 1, total: products.length, name: product.name }, "Registering product");
      logger.debug({ name: product.name }, "Navigating to product collection page");
      await this.goToItsPage();
      await this.page.waitForLoadState("networkidle");
      await this.dismissGuidedTour();

      logger.debug("Clicking Create new entry");
      await this.page
        .getByRole("link", { name: /Create new entry/i })
        .first()
        .click();
      await this.page.waitForLoadState("networkidle");

      const nameField = this.page.getByLabel("Name");
      const priceField = this.page.getByLabel("Price");

      await nameField.waitFor({ state: "visible" });
      logger.debug(
        { name: product.name, price: product.price, description: product.description },
        "Filling product form",
      );
      await nameField.click();
      await nameField.fill(product.name);

      await priceField.click();
      await priceField.fill(String(product.price));

      if (product.description) {
        const descField = this.page.getByLabel("Description");
        await descField.click();
        await descField.fill(product.description);
      }

      await nameField.click();
      await this.page.waitForTimeout(500);

      await this.page.getByRole("button", { name: /save/i }).click();
      logger.info({ name: product.name }, "Saving product");

      await this.page.waitForResponse(
        (response) => response.url().includes("/content-manager/") && response.status() === 200,
      );
      await this.page.waitForLoadState("networkidle");

      await this.page.getByRole("button", { name: /publish/i }).click();
      logger.info({ name: product.name }, "Publishing product");
      await this.page.waitForLoadState("networkidle");
    }
    logger.info("All products registered");
  }
}
