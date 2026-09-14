import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { updateBooking, type BookingSummary } from "../api/bookings";

type RescheduleBookingFormProps = {
  booking: BookingSummary;
  onUpdated: (booking: BookingSummary) => void;
};

function toLocalDateTimeValue(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function RescheduleBookingForm({
  booking,
  onUpdated,
}: RescheduleBookingFormProps) {
  const originalStartsAt = toLocalDateTimeValue(booking.starts_at);
  const originalEndsAt = toLocalDateTimeValue(booking.ends_at);
  const [startsAt, setStartsAt] = useState(originalStartsAt);
  const [endsAt, setEndsAt] = useState(originalEndsAt);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const hasChanged = startsAt !== originalStartsAt || endsAt !== originalEndsAt;

  function updateStartsAt(value: string) {
    setStartsAt(value);
    setSaveStatus("idle");
    setError(null);
  }

  function updateEndsAt(value: string) {
    setEndsAt(value);
    setSaveStatus("idle");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasChanged || saveStatus === "saving") return;

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("The booking must end after it starts.");
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    setError(null);

    try {
      const updatedBooking = await updateBooking(booking.id, {
        starts_at: startsAt,
        ends_at: endsAt,
      });
      onUpdated(updatedBooking);
      setSaveStatus("saved");
    } catch {
      setError(
        "The booking could not be rescheduled. Check the time is available and try again.",
      );
      setSaveStatus("idle");
    }
  }

  const inputClassName = "mt-2 w-full rounded-xl border border-[#ccd5d0] bg-white px-3 py-2.5 text-base font-normal text-[#263a35] outline-none focus:border-[#1f765f] focus:ring-2 focus:ring-[#1f765f]/20 disabled:bg-[#f2f3ef]";

  return (
    <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)] md:col-span-2">
      <h2 className="text-lg font-bold">Reschedule booking</h2>
      <p className="mt-1 text-sm text-[#66736f]">
        Choose a new start and end time. TutorDesk will reject clashes with another booking.
      </p>

      <form onSubmit={handleSubmit} aria-busy={saveStatus === "saving"}>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#344a44]">
            Starts
            <input
              required
              type="datetime-local"
              value={startsAt}
              onChange={(event) => updateStartsAt(event.target.value)}
              disabled={saveStatus === "saving"}
              className={inputClassName}
            />
          </label>
          <label className="text-sm font-semibold text-[#344a44]">
            Ends
            <input
              required
              type="datetime-local"
              value={endsAt}
              onChange={(event) => updateEndsAt(event.target.value)}
              disabled={saveStatus === "saving"}
              className={inputClassName}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-[#9b3f2f]">
            {error}
          </p>
        )}
        {saveStatus === "saved" && (
          <p role="status" className="mt-4 text-sm font-semibold text-[#1f765f]">
            Booking rescheduled.
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={!hasChanged || saveStatus === "saving"}
            className="inline-flex min-w-34 items-center justify-center gap-2 rounded-xl bg-[#1f765f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#195f4d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveStatus === "saving" && (
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            )}
            {saveStatus === "saving" ? "Saving…" : "Save new time"}
          </button>
        </div>
      </form>
    </section>
  );
}
