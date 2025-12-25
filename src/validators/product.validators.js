const { z } = require("zod");

const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    sku: z.string().min(2),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    cost: z.number().nonnegative().optional(),
    currency: z.enum(["TRY", "USD", "EUR"]).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    stock: z.number().int().nonnegative().optional(),
    status: z.enum(["active", "draft", "archived"]).optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z
    .object({
      title: z.string().min(2).optional(),
      sku: z.string().min(2).optional(),
      description: z.string().optional(),
      price: z.number().nonnegative().optional(),
      cost: z.number().nonnegative().optional(),
      currency: z.enum(["TRY", "USD", "EUR"]).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      stock: z.number().int().nonnegative().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      images: z.array(z.string().url()).optional(),
      soldCount: z.number().int().nonnegative().optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field required" }),
});

const productIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

module.exports = { createProductSchema, updateProductSchema, productIdSchema };
