import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { updateStudent, type StudentDetail } from "../api/students";

type EditStudentFormProps = {
  student: StudentDetail;
  onCancel: () => void;
  onUpdated: (student: StudentDetail) => void;
};

export function EditStudentForm({ student, onCancel, onUpdated }: EditStudentFormProps) {
  const [firstName, setFirstName] = useState(student.first_name);
  const [lastName, setLastName] = useState(student.last_name);
  const [yearGroup, setYearGroup] = useState(student.year_group);
  const [subjects, setSubjects] = useState(student.subjects);
  const [goals, setGoals] = useState(student.goals);
  const [learningNeeds, setLearningNeeds] = useState(student.learning_needs);
  const [isActive, setIsActive] = useState(student.is_active);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const updatedStudent = await updateStudent(student.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        year_group: yearGroup.trim(),
        subjects: subjects.trim(),
        goals: goals.trim(),
        learning_needs: learningNeeds.trim(),
        is_active: isActive,
      });
      onUpdated(updatedStudent);
    } catch {
      setError("The student record could not be saved. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClassName = "mt-1.5 w-full rounded-xl border border-[#d8ddd4] bg-white px-3.5 py-2.5 text-base text-[#21332f] outline-none focus:border-[#2a826b] focus:ring-2 focus:ring-[#2a826b]/15 disabled:bg-[#f2f3ef]";

  return (
    <section className="rounded-3xl border border-[#cddfd9] bg-[#f8fcfa] p-5 shadow-[0_10px_30px_rgba(27,47,43,0.05)] md:p-7" aria-labelledby="edit-student-heading">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#1f765f]">Student record</p>
        <h1 id="edit-student-heading" className="mt-1 text-3xl font-bold tracking-[-0.04em]">Edit {student.first_name} {student.last_name}</h1>
      </div>

      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#344b45]">
            First name
            <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Last name
            <input required value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Year group <span className="font-normal text-[#7b8884]">(optional)</span>
            <input value={yearGroup} onChange={(event) => setYearGroup(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Subjects <span className="font-normal text-[#7b8884]">(optional)</span>
            <textarea rows={3} value={subjects} onChange={(event) => setSubjects(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Learning goals <span className="font-normal text-[#7b8884]">(optional)</span>
            <textarea rows={4} value={goals} onChange={(event) => setGoals(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Private learning notes <span className="font-normal text-[#7b8884]">(optional)</span>
            <textarea rows={4} value={learningNeeds} onChange={(event) => setLearningNeeds(event.target.value)} disabled={submitting} className={inputClassName} />
            <span className="mt-1.5 block text-sm font-normal text-[#7a6b43]">Never shown in student or guardian portals.</span>
          </label>
        </div>

        <label className="mt-5 flex w-fit items-center gap-3 rounded-xl border border-[#d8ddd4] bg-white px-4 py-3 text-sm font-semibold text-[#344b45]">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={submitting} className="size-4 accent-[#1f765f]" />
          Active student
        </label>

        {error && <p role="alert" className="mt-4 text-sm font-semibold text-[#9a442f]">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border border-[#ccd5ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#3d544e] disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[#1f765f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#185f4d] disabled:opacity-65">
            {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
