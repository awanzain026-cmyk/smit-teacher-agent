import { courseRepo } from "../repositories/documentRepo.js";
import { ApiError } from "./apiError.js";

/**
 * Resolves a courseId (if provided) and verifies it exists.
 * Courses are read-visible to everyone; only admins create/delete them.
 */
export async function safeCourseId(courseId: string | null | undefined, _userId: string, _isAdmin = false): Promise<string | null> {
  if (!courseId) return null;
  const course = await courseRepo.findById(courseId);
  if (!course) throw ApiError.badRequest("Unknown course");
  return course.id;
}
