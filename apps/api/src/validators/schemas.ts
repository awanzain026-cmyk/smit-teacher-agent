import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");
const name = z.string().trim().min(2, "Name must be at least 2 characters").max(120);

export const registerSchema = z.object({
  body: z.object({
    name,
    email,
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const adminSeedSchema = z.object({
  body: z.object({
    secret: z.string().min(1),
    name,
    email,
    password,
  }),
});

const uuidParam = z.string().uuid("Invalid id");

export const idParamsSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
});

export const listDocumentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    courseId: z.string().uuid().optional().nullable(),
  }),
});

export const uploadDocumentSchema = z.object({
  query: z.object({
    courseId: z.string().uuid().optional().nullable(),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    conversationId: z.string().uuid().optional().nullable(),
    courseId: z.string().uuid().optional().nullable(),
    message: z.string().trim().min(1, "Message cannot be empty").max(4000, "Message is too long"),
  }),
});

export const createCourseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, "Course name must be at least 3 characters").max(160),
    description: z.string().trim().max(2000).optional().nullable(),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    name: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
  }),
});

export const createConversationSchema = z.object({
  body: z.object({
    courseId: z.string().uuid().optional().nullable(),
  }),
});

export const renameConversationSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    title: z.string().trim().min(1).max(255),
  }),
});

export const searchConversationsSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1).max(100),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
  }),
});

export const changeRoleSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    role: z.enum(["STUDENT", "ADMIN"]),
  }),
});

export const adminDocumentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(["PENDING", "PROCESSING", "READY", "FAILED"]).optional(),
  }),
});
