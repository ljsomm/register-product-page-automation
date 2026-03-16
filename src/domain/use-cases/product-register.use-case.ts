import { IProductPort } from "../../ports/in/product.port";
import { IProductReadPort } from "../../ports/out/product-read.port";
import { IProductWritePort } from "../../ports/out/product-write.port";
import { Product, ProductSchema } from "../entity/product.entity";

export class ProductRegisterUseCase implements IProductPort {
  constructor(
    private productReadAdapter: IProductReadPort,
    private productWriteAdapter: IProductWritePort,
  ) {}

  public async findAll(): Promise<Array<Product>> {
    return await this.productReadAdapter.readAll();
  }

  public async registerAllFoundProducts(): Promise<void> {
    const products = await this.findAll();

    const validatedProducts = products.map((product, index) => {
      const result = ProductSchema.safeParse(product);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new Error(`Product at row ${index + 1} is invalid: ${errors}`);
      }
      return result.data as Product;
    });

    await this.productWriteAdapter.saveAll(validatedProducts);
  }
}
