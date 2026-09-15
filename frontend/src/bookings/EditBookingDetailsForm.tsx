import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import {
  updateBooking,
  type BookingFormat,
  type BookingSummary,
} from "../api/bookings";

type EditBookingDetailsFormProps = {
  booking: BookingSummary;
  onUpdated: (booking: BookingSummary) => void;
};

export function EditBookingDetailsForm({
  booking,
  onUpdated,
}: EditBookingDetailsFormProps) {
  const [format, setFormat] = useState<BookingFormat>(booking.format);
  const [location, setLocation] = useState(booking.location);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const cleanedLocation = location.trim();
  const hasChanged = format !== booking.format || cleanedLocation !== booking.location;

  function clearFeedback() {
    setSaveStatus("idle");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasChanged || saveStatus === "saving") return;

    setSaveStatus("saving");
    setError(null);

    try {
      const updatedBooking = await updateBooking(booking.id, {
        format,
        location: cleanedLocation,
      });
      setFormat(updatedBooking.format);
      setLocation(updatedBooking.location);
      onUpdated(updatedBooking);
      setSaveStatus("saved");
    } catch {
      setError("The lesson details could not be saved. Please try again.");
      setSaveStatus("idle");
    }
  }

  const inputClassName = "mt-2 w-full rounded-xl border border-[#ccd5d0] bg-white px-3 py-2.5 text-base font-normal text-[#263a35] outline-none focus:border-[#1f765f] focus:ring-2 focus:ring-[#1f765f]/20 disabled:bg-[#f2f3ef]";

  return (
    <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)] md:col-span-2">
      <h2 className="text-lg font-bold">Edit lesson details</h2>
      <p className="mt-1 text-sm text-[#66736f]">
        Update how the lesson will take place and where the student should join you.
      </p>

      <form onSubmit={handleSubmit} aria-busy={saveStatus === "saving"}>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#344a44]">
            Lesson format
            <select
              value={format}
              onChange={(event) => {
                setFormat(event.target.value as BookingFormat);
                clearFeedback();
              }}
              disabled={saveStatus === "saving"}
              className={inputClassName}
            >
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-[#344a44]">
            Location or meeting link <span className="font-normal text-[#7b8884]">(optional)</span>
            <input
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                clearFeedback();
              }}
              disabled={saveStatus === "saving"}
              placeholder={format === "online" ? "For example, Google Meet" : "For example, Central Library"}
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
            Lesson details saved.
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
            {saveStatus === "saving" ? "Saving…" : "Save lesson details"}
          </button>
        </div>
      </form>
    </section>
  );
}
