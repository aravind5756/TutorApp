import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, BookOpen, LoaderCircle, LockKeyhole } from "lucide-react";

import { getStudent, type StudentDetail } from "../api/students";

type StudentDetailsProps = {
  studentId: number;
  onBack: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export function StudentDetails({ studentId, onBack }: StudentDetailsProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");

    getStudent(studentId)
      .then((record) => {
        if (!active) return;
        setStudent(record);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => { active = false; };
  }, [studentId, reloadCount]);

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#35685b] hover:text-[#174f40]">
        <ArrowLeft size={18} aria-hidden="true" /> Back to students
      </button>

      {status === "loading" && (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-[#dfe2d9] bg-white font-semibold text-[#1f765f]">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Loading student details…
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-3xl border border-[#efd1c8] bg-[#fff7f4] p-6 text-[#8d402e]">
          <div className="flex items-center gap-3 font-bold"><AlertCircle aria-hidden="true" /> Student details could not be loaded</div>
          <p className="mt-2 text-sm">Check that the backend is running, then try again.</p>
          <button type="button" onClick={() => setReloadCount((count) => count + 1)} className="mt-4 rounded-xl bg-[#8d402e] px-4 py-2 text-sm font-semibold text-white">Try again</button>
        </div>
      )}

      {status === "ready" && student && (
        <>
          <header className="mb-6 rounded-3xl bg-[#203e3a] p-6 text-white shadow-[0_14px_34px_rgba(28,60,54,0.16)] md:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d9efe9] text-lg font-bold text-[#205b4d]">
                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#9fc5bb]">Student record</p>
                  <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">{student.first_name} {student.last_name}</h1>
                  <p className="mt-1 text-sm text-[#c7d9d5]">{student.year_group || "Year group not set"}</p>
                </div>
              </div>
              <span className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${student.is_active ? "bg-[#d9efe9] text-[#205b4d]" : "bg-white/12 text-[#d9e3e0]"}`}>
                {student.is_active ? "Active student" : "Inactive student"}
              </span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#e4f2ee] text-[#1f765f]"><BookOpen size={18} aria-hidden="true" /></div>
                <h2 className="text-lg font-bold">Tutoring</h2>
              </div>
              <h3 className="text-sm font-semibold text-[#64736f]">Subjects</h3>
              <p className="mt-1 whitespace-pre-line leading-7 text-[#263a35]">{student.subjects || "No subjects added yet."}</p>
              <h3 className="mt-5 text-sm font-semibold text-[#64736f]">Learning goals</h3>
              <p className="mt-1 whitespace-pre-line leading-7 text-[#263a35]">{student.goals || "No learning goals added yet."}</p>
            </section>

            <section className="rounded-3xl border border-[#eadcae] bg-[#fffaf0] p-6 shadow-[0_10px_30px_rgba(77,60,18,0.04)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#f8e8b7] text-[#7d5b08]"><LockKeyhole size={18} aria-hidden="true" /></div>
                <div>
                  <h2 className="text-lg font-bold">Private tutor notes</h2>
                  <p className="text-sm text-[#7a6b43]">Never shown in student or guardian portals</p>
                </div>
              </div>
              <p className="whitespace-pre-line leading-7 text-[#40391f]">{student.learning_needs || "No private learning notes added yet."}</p>
            </section>
          </div>

          <p className="mt-5 text-sm text-[#7a8581]">Record updated {dateFormatter.format(new Date(student.updated_at))}</p>
        </>
      )}
    </div>
  );
}
