import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, UsersRound } from "lucide-react";

import { getStudents, type StudentSummary } from "../api/students";

function StudentCard({ student }: { student: StudentSummary }) {
  const subjects = student.subjects
    .split(/[,\n]/)
    .map((subject) => subject.trim())
    .filter(Boolean);

  return (
    <li className="rounded-2xl border border-[#e0e2da] bg-white p-5 shadow-[0_8px_30px_rgba(27,47,43,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d9efe9] font-bold text-[#205b4d]">
            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-bold text-[#21332f]">
              {student.first_name} {student.last_name}
            </h2>
            <p className="mt-0.5 text-sm text-[#77817e]">
              {student.year_group || "Year group not set"}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          student.is_active
            ? "bg-[#e4f3ed] text-[#246c58]"
            : "bg-[#eceee9] text-[#68736f]"
        }`}>
          {student.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {subjects.length ? subjects.map((subject) => (
          <span key={subject} className="rounded-lg bg-[#f1f3ed] px-2.5 py-1 text-sm text-[#50605c]">
            {subject}
          </span>
        )) : <span className="text-sm text-[#8a9490]">No subjects added</span>}
      </div>
    </li>
  );
}

export function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function loadStudents(pageToLoad: number) {
    setStatus("loading");
    try {
      const response = await getStudents(pageToLoad);
      setStudents((current) => pageToLoad === 1 ? response.results : [...current, ...response.results]);
      setPage(pageToLoad);
      setHasMore(response.next !== null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadStudents(1);
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
      <header className="mb-7">
        <p className="mb-1 text-sm font-semibold text-[#1f765f]">Student records</p>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172825] md:text-4xl">Students</h1>
        <p className="mt-2 text-sm leading-6 text-[#6e7a76] md:text-base">
          View the learners currently stored in TutorDesk.
        </p>
      </header>

      {status === "loading" && students.length === 0 && (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-[#dfe2d9] bg-white font-semibold text-[#1f765f]">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Loading students…
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-3xl border border-[#efd1c8] bg-[#fff7f4] p-6 text-[#8d402e]">
          <div className="flex items-center gap-3 font-bold"><AlertCircle aria-hidden="true" /> Students could not be loaded</div>
          <p className="mt-2 text-sm">Check that the backend is running, then try again.</p>
          <button type="button" onClick={() => void loadStudents(students.length ? page + 1 : 1)} className="mt-4 rounded-xl bg-[#8d402e] px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && students.length === 0 && (
        <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#cfd5cc] bg-white p-6 text-center">
          <div>
            <UsersRound className="mx-auto mb-4 text-[#6b817b]" size={32} aria-hidden="true" />
            <h2 className="text-lg font-bold">No students yet</h2>
            <p className="mt-2 text-sm text-[#77817e]">Add your first student through Django admin.</p>
          </div>
        </div>
      )}

      {students.length > 0 && (
        <>
          <p className="mb-4 text-sm font-medium text-[#66736f]">
            Showing {students.length} student{students.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => <StudentCard key={student.id} student={student} />)}
          </ul>
          {hasMore && status !== "error" && (
            <div className="mt-6 flex justify-center">
              <button type="button" disabled={status === "loading"} onClick={() => void loadStudents(page + 1)} className="rounded-xl border border-[#cfd8d1] bg-white px-4 py-2.5 text-sm font-semibold text-[#28594d] disabled:opacity-60">
                {status === "loading" ? "Loading…" : "Load more students"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
