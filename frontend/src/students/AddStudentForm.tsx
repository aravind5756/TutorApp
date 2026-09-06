import { useState, type FormEvent } from "react";
import { LoaderCircle, X } from "lucide-react";

import { createStudent, type StudentSummary } from "../api/students";

type AddStudentFormProps = {
  onCancel: () => void;
  onCreated: (student: StudentSummary) => void;
};

export function AddStudentForm({ onCancel, onCreated }: AddStudentFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [subjects, setSubjects] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const student = await createStudent({
        first_name: firstName.trim(), last_name: lastName.trim(),
        year_group: yearGroup.trim(), subjects: subjects.trim(),
      });
      onCreated(student);
    } catch {
      setError("The student could not be added. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClassName = "mt-1.5 w-full rounded-xl border border-[#d8ddd4] bg-white px-3.5 py-2.5 text-base text-[#21332f] outline-none focus:border-[#2a826b] focus:ring-2 focus:ring-[#2a826b]/15 disabled:bg-[#f2f3ef]";

  return (
    <section className="mb-7 rounded-3xl border border-[#cddfd9] bg-[#f8fcfa] p-5 shadow-[0_10px_30px_rgba(27,47,43,0.05)] md:p-6" aria-labelledby="add-student-heading">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="add-student-heading" className="text-xl font-bold">Add student</h2>
          <p className="mt-1 text-sm text-[#6e7a76]">Create a basic student record. More details can be added later.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg p-2 text-[#63736f] hover:bg-[#e7f0ec] disabled:opacity-50" aria-label="Close add student form">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#344b45]">
            First name
            <input required autoComplete="off" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Last name
            <input required autoComplete="off" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Year group <span className="font-normal text-[#7b8884]">(optional)</span>
            <input value={yearGroup} onChange={(event) => setYearGroup(event.target.value)} disabled={submitting} placeholder="For example, Year 11" className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Subjects <span className="font-normal text-[#7b8884]">(optional)</span>
            <input value={subjects} onChange={(event) => setSubjects(event.target.value)} disabled={submitting} placeholder="For example, Mathematics, Physics" className={inputClassName} />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 text-sm font-semibold text-[#9a442f]">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border border-[#ccd5ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#3d544e] disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex min-w-30 items-center justify-center gap-2 rounded-xl bg-[#1f765f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#185f4d] disabled:opacity-65">
            {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Adding…" : "Add student"}
          </button>
        </div>
      </form>
    </section>
  );
}
