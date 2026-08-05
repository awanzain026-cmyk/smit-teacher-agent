import { courseRepo } from "../repositories/documentRepo.js";
import { ApiError } from "../lib/apiError.js";

export class CourseService {
  async list() {
    const courses = await courseRepo.list();
    return courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async create(data: { name: string; description?: string | null; adminId: string }) {
    if (data.name.trim().length < 3) {
      throw ApiError.badRequest("Course name must be at least 3 characters");
    }
    const course = await courseRepo.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      adminId: data.adminId,
    });
    return course;
  }

  async update(id: string, data: { name?: string; description?: string | null }) {
    const course = await courseRepo.findById(id);
    if (!course) throw ApiError.notFound("Course not found");
    return courseRepo.update(id, {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    });
  }

  async remove(id: string): Promise<void> {
    const course = await courseRepo.findById(id);
    if (!course) throw ApiError.notFound("Course not found");
    await courseRepo.delete(id);
  }
}

export const courseService = new CourseService();
