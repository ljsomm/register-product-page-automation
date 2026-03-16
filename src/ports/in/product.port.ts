import { Product } from "../../domain/entity/product.entity";

export interface IProductPort {
  registerAllFoundProducts(): Promise<void>;
  findAll(): Promise<Array<Product>>;
}
