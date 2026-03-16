import { Product } from "../../domain/entity/product.entity";

export interface IProductReadPort {
  readAll(): Promise<Array<Product>>;
}
