"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, FolderPlus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import type { CourseDto } from "@smit/shared";

export function CourseManager() {
  const { user } = useAuth();
  const { toast, success, error } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<{ courses: CourseDto[] }>("/api/v1/courses");
      setCourses(res.courses);
    } catch {
      error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (name.trim().length < 3) return;
    try {
      await api("/api/v1/courses", {
        method: "POST",
        body: { name: name.trim(), description: description.trim() || null },
      });
      setName("");
      setDescription("");
      setCreating(false);
      success("Course created");
      await load();
    } catch (err) {
      error("Failed to create course", err instanceof Error ? err.message : undefined);
    }
  };

  const remove = async (course: CourseDto) => {
    if (!window.confirm(`Delete course "${course.name}"? Its documents will be unassigned.`)) return;
    try {
      await api(`/api/v1/courses/${course.id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      toast("success", "Course deleted");
    } catch (err) {
      error("Failed to delete course", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group your course material by subject or batch.
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setCreating(true)}>
            <FolderPlus className="h-4 w-4" />
            New course
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="No courses yet"
          description={
            isAdmin
              ? "Create your first course to organize documents."
              : "Your admin hasn't created any courses yet."
          }
        />
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{course.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {course.description || "No description"}
                  {course.createdAt ? <span className="ml-1.5">· Created {timeAgo(course.createdAt)}</span> : null}
                </p>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => void remove(course)}
                  aria-label={`Delete ${course.name}`}
                  title="Delete course"
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)}>
        <h2 className="text-base font-semibold text-foreground">Create a course</h2>
        <p className="mt-1 text-sm text-muted-foreground">Organize documents by course or subject.</p>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-name">Course name</Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MERN Stack Bootcamp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-desc">Description (optional)</Label>
            <Input
              id="course-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of the course"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()} disabled={name.trim().length < 3}>
              Create course
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
