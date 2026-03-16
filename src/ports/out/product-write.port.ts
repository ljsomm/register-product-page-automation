import { Product } from "../../domain/entity/product.entity";

export interface IProductWritePort {
  saveAll(products: Array<Product>): Promise<void>;
}
