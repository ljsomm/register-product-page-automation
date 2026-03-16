import { readFileSync } from "node:fs";
import { Product } from "../../domain/entity/product.entity";
import { parseCSV } from "../../utils/csv";
import { IProductReadPort } from "../../ports/out/product-read.port";
import { resolve } from "path";

export class CSVProductAdapter implements IProductReadPort {
  constructor(private filePath: string) {}

  async readAll(): Promise<Array<Product>> {
    const resolvedFilePath = resolve(process.cwd(), this.filePath);
    const fileContent = readFileSync(resolvedFilePath, "utf-8");
    const parsedCSV = parseCSV(fileContent);

    const headers = parsedCSV.at(0);
    const rows = parsedCSV.slice(1);

    const products: Array<Product> = rows.map((row) => {
      const raw: Record<string, string> = {};
      headers?.forEach((header, index) => {
        raw[header] = row[index];
      });
      return {
        name: raw["name"],
        price: Number(raw["price"]),
        description: raw["description"] || undefined,
      };
    });

    return products;
  }
}
