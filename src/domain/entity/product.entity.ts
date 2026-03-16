import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
