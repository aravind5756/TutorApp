import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, X } from "lucide-react";

import {
  createBooking,
  type BookingFormat,
  type BookingStatus,
  type BookingSummary,
} from "../api/bookings";
import { getStudents, type StudentSummary } from "../api/students";

type NewBookingFormProps = {
  onCancel: () => void;
  onCreated: (booking: BookingSummary) => void;
};

export function NewBookingForm({ onCancel, onCreated }: NewBookingFormProps) {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [studentId, setStudentId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [format, setFormat] = useState<BookingFormat>("online");
  const [location, setLocation] = useState("");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("confirmed");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActiveStudents() {
      try {
        const loadedStudents: StudentSummary[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await getStudents(page);
          loadedStudents.push(...response.results.filter((student) => student.is_active));
          hasMore = response.next !== null;
          page += 1;
        }

        if (active) {
          setStudents(loadedStudents);
          setStudentId(loadedStudents[0]?.id.toString() ?? "");
          setLoadingStudents(false);
        }
      } catch {
        if (active) {
          setError("Students could not be loaded. Please try again.");
          setLoadingStudents(false);
        }
      }
    }

    void loadActiveStudents();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !studentId) return;

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("The booking must end after it starts.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking({
        student: Number(studentId),
        starts_at: startsAt,
        ends_at: endsAt,
        format,
        location: location.trim(),
        status: bookingStatus,
      });
      onCreated(booking);
    } catch {
      setError("The booking could not be added. Check the time is available and try again.");
      setSubmitting(false);
    }
  }

  const inputClassName = "mt-1.5 w-full rounded-xl border border-[#d8ddd4] bg-white px-3.5 py-2.5 text-base text-[#21332f] outline-none focus:border-[#2a826b] focus:ring-2 focus:ring-[#2a826b]/15 disabled:bg-[#f2f3ef]";

  return (
    <section className="mb-7 rounded-3xl border border-[#cddfd9] bg-[#f8fcfa] p-5 shadow-[0_10px_30px_rgba(27,47,43,0.05)] md:p-6" aria-labelledby="new-booking-heading">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="new-booking-heading" className="text-xl font-bold">New booking</h2>
          <p className="mt-1 text-sm text-[#6e7a76]">Schedule a lesson with an active student.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg p-2 text-[#63736f] hover:bg-[#e7f0ec] disabled:opacity-50" aria-label="Close new booking form">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#344b45] md:col-span-2">
            Student
            <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={loadingStudents || submitting || students.length === 0} className={inputClassName}>
              {loadingStudents && <option value="">Loading students…</option>}
              {!loadingStudents && students.length === 0 && <option value="">No active students available</option>}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}{student.year_group ? ` · ${student.year_group}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-[#344b45]">
            Starts
            <input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Ends
            <input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} disabled={submitting} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Lesson format
            <select value={format} onChange={(event) => setFormat(event.target.value as BookingFormat)} disabled={submitting} className={inputClassName}>
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#344b45]">
            Status
            <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value as BookingStatus)} disabled={submitting} className={inputClassName}>
              <option value="confirmed">Confirmed</option>
              <option value="requested">Requested</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#344b45] md:col-span-2">
            Location or meeting link <span className="font-normal text-[#7b8884]">(optional)</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} disabled={submitting} placeholder={format === "online" ? "For example, Google Meet" : "For example, Central Library"} className={inputClassName} />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 text-sm font-semibold text-[#9a442f]">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border border-[#ccd5ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#3d544e] disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={loadingStudents || submitting || students.length === 0} className="inline-flex min-w-34 items-center justify-center gap-2 rounded-xl bg-[#1f765f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#185f4d] disabled:opacity-65">
            {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Creating…" : "Create booking"}
          </button>
        </div>
      </form>
    </section>
  );
}
