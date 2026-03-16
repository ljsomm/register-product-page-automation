import { CSVProductAdapter } from "./adapters/csv/product.adapter";
import { EnvironmentSecretAdapter } from "./adapters/environment/secret.adapter";
import { IProductReadPort } from "./ports/out/product-read.port";
import { ProductRegisterUseCase } from "./domain/use-cases/product-register.use-case";
import { PlaywrightProductAdapter } from "./adapters/playwright-strapi/product.adapter";
import { IProductWritePort } from "./ports/out/product-write.port";
import { ISecretReadPort } from "./ports/out/secret-read.port";
import { config as initializeDotenv } from "dotenv";
import { logger } from "./utils/logger";
import { IProductPort } from "./ports/in/product.port";

async function main() {
  initializeDotenv();
  logger.info("Starting product registration automation");

  const csvPath = process.env.PRODUCT_LIST_INPUT_FILE;
  if (!csvPath) throw new Error("PRODUCT_LIST_INPUT_FILE environment variable must be set.");

  logger.debug({ csvPath }, "CSV path resolved");

  const productPageURL =
    process.env.REGISTER_PRODUCT_PAGE_URL ??
    "http://localhost:1337/admin/content-manager/collection-types/api::product.product";
  logger.debug({ productPageURL }, "Product page URL resolved");

  const secretAdapter: ISecretReadPort = new EnvironmentSecretAdapter();

  const cmsSecretName = process.env.CMS_CREDENTIALS_SECRET_NAME;
  if (!cmsSecretName) throw new Error("CMS_CREDENTIALS_SECRET_NAME environment variable must be set.");

  const credentials = JSON.parse(await secretAdapter.read(cmsSecretName));

  const productReaderAdapter: IProductReadPort = new CSVProductAdapter(csvPath);
  const productWriterAdapter: IProductWritePort = await PlaywrightProductAdapter.init({
    pageURL: productPageURL,
    credentials,
  });

  const productRegisterUseCase: IProductPort = new ProductRegisterUseCase(productReaderAdapter, productWriterAdapter);
  await productRegisterUseCase.registerAllFoundProducts();

  logger.info("Product registration automation completed");
}

main();
