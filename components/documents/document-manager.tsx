"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, FileText, Search, RefreshCw, Trash2, Filter } from "lucide-react";
import { api, apiForm } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatBytes, timeAgo } from "@/lib/utils";
import { Dropzone } from "@/components/ui/dropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentStatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import type { DocumentDto, CourseDto, Paginated } from "@smit/shared";

export function DocumentManager() {
  const { toast, success, error } = useToast();

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (courseFilter) query.set("courseId", courseFilter);
      const [docRes, courseRes] = await Promise.all([
        api<Paginated<DocumentDto>>(`/api/v1/documents?${query.toString()}`),
        api<{ courses: CourseDto[] }>("/api/v1/courses"),
      ]);
      setDocuments(docRes.items);
      setCourses(courseRes.courses);
    } catch {
      error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, error]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, courseFilter]);

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const url = courseFilter ? `/api/v1/documents?courseId=${courseFilter}` : "/api/v1/documents";
          await apiForm<{ document: DocumentDto }>(url, formData);
        }
        success(`${files.length} document${files.length > 1 ? "s" : ""} uploaded`, "Processing started — you'll be able to chat about them shortly.");
        await load();
      } catch (err) {
        error("Upload failed", err instanceof Error ? err.message : undefined);
      } finally {
        setUploading(false);
      }
    },
    [courseFilter, load, success, error],
  );

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Its indexed content will also be removed.`)) return;
    try {
      await api(`/api/v1/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast("success", "Document deleted");
    } catch {
      error("Failed to delete document");
    }
  };

  const reprocess = async (id: string) => {
    try {
      await api(`/api/v1/documents/${id}/reprocess`, { method: "POST" });
      toast("info", "Reprocessing started");
      await load();
    } catch {
      error("Failed to reprocess document");
    }
  };

  const createCourse = async () => {
    if (newCourseName.trim().length < 3) return;
    try {
      await api("/api/v1/courses", {
        method: "POST",
        body: { name: newCourseName, description: newCourseDesc || null },
      });
      setCreatingCourse(false);
      setNewCourseName("");
      setNewCourseDesc("");
      success("Course created");
      await load();
    } catch (err) {
      error("Failed to create course", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload course material to build your knowledge base.
          </p>
        </div>
        <Button variant="outline" onClick={() => setCreatingCourse(true)}>
          <FolderOpen className="h-4 w-4" />
          New course
        </Button>
      </div>

      <Dropzone onFiles={upload} loading={uploading} className="mb-6" />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            aria-label="Search documents"
            className="pl-8"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
            className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-8 pr-8 text-sm text-foreground focus:border-primary focus:outline-none sm:w-52"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={search || courseFilter ? "No matching documents" : "No documents yet"}
          description={
            search || courseFilter
              ? "Try adjusting your search or course filter."
              : "Upload your first PDF, DOCX, PPTX or TXT file to start chatting with your material."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ul className="divide-y divide-border/60">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.originalName}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatBytes(doc.sizeBytes)}</span>
                    <span>·</span>
                    <span>{doc.courseName ?? "No course"}</span>
                    {doc.pageCount ? (
                      <>
                        <span>·</span>
                        <span>{doc.pageCount} pages</span>
                      </>
                    ) : null}
                    <span>·</span>
                    <span>{timeAgo(doc.createdAt)}</span>
                  </p>
                  {doc.status === "FAILED" && doc.failReason ? (
                    <p className="mt-0.5 text-xs text-destructive">{doc.failReason}</p>
                  ) : null}
                </div>
                <DocumentStatusBadge status={doc.status} />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => void reprocess(doc.id)}
                    aria-label={`Reprocess ${doc.originalName}`}
                    title="Reprocess"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void remove(doc.id, doc.originalName)}
                    aria-label={`Delete ${doc.originalName}`}
                    title="Delete"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={creatingCourse} onClose={() => setCreatingCourse(false)}>
        <h2 className="text-base font-semibold text-foreground">Create a course</h2>
        <p className="mt-1 text-sm text-muted-foreground">Organize documents by course or subject.</p>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="course-name">Course name</Label>
            <Input
              id="course-name"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="e.g. Web Development Fundamentals"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-desc">Description (optional)</Label>
            <Input
              id="course-desc"
              value={newCourseDesc}
              onChange={(e) => setNewCourseDesc(e.target.value)}
              placeholder="Short summary of the course"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreatingCourse(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createCourse()} disabled={newCourseName.trim().length < 3}>
              Create course
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
