const { z } = require("zod");

const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    role: z.enum(["admin", "manager", "user"]).optional(),
    sortBy: z.enum(["createdAt", "name", "email", "role"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      name: z.string().min(2).optional(),
      role: z.enum(["admin", "manager", "user"]).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field required" }),
});

const userIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

module.exports = { listUsersQuerySchema, updateUserSchema, userIdSchema };
