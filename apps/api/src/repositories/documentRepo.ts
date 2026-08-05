import { Prisma, type Document, type Course } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const docWithCourse = Prisma.validator<Prisma.DocumentInclude>()({ course: { select: { id: true, name: true } } });
export type DocumentWithCourse = Document & { course: { id: string; name: string } | null };

export const documentRepo = {
  create(data: Prisma.DocumentUncheckedCreateInput): Promise<Document> {
    return prisma.document.create({ data });
  },

  findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } });
  },

  findByIdWithCourse(id: string): Promise<DocumentWithCourse | null> {
    return prisma.document.findUnique({ where: { id }, include: docWithCourse });
  },

  update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return prisma.document.update({ where: { id }, data });
  },

  list(params: {
    userId?: string;
    courseId?: string;
    search?: string;
    skip: number;
    take: number;
  }): Promise<DocumentWithCourse[]> {
    return prisma.document.findMany({
      where: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.courseId ? { courseId: params.courseId } : {}),
        ...(params.search
          ? { originalName: { contains: params.search, mode: "insensitive" } }
          : {}),
      },
      include: docWithCourse,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  count(params: { userId?: string; courseId?: string; search?: string } = {}): Promise<number> {
    return prisma.document.count({
      where: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.courseId ? { courseId: params.courseId } : {}),
        ...(params.search
          ? { originalName: { contains: params.search, mode: "insensitive" } }
          : {}),
      },
    });
  },

  countByStatus(status: Document["status"]): Promise<number> {
    return prisma.document.count({ where: { status } });
  },

  delete(id: string): Promise<Document> {
    return prisma.document.delete({ where: { id } });
  },
};

export const courseRepo = {
  create(data: Prisma.CourseUncheckedCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  },

  findById(id: string): Promise<Course | null> {
    return prisma.course.findUnique({ where: { id } });
  },

  list(): Promise<Course[]> {
    return prisma.course.findMany({ orderBy: { name: "asc" } });
  },

  update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return prisma.course.update({ where: { id }, data });
  },

  delete(id: string): Promise<Course> {
    return prisma.course.delete({ where: { id } });
  },
};
