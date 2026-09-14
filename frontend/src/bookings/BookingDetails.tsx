import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Laptop,
  LoaderCircle,
  MapPin,
  UserRound,
} from "lucide-react";

import {
  getBooking,
  updateBooking,
  type BookingStatus,
  type BookingSummary,
} from "../api/bookings";
import { RescheduleBookingForm } from "./RescheduleBookingForm";

type BookingDetailsProps = {
  bookingId: number;
  onBack: () => void;
};

const statusStyles: Record<BookingStatus, string> = {
  requested: "bg-[#fff1cf] text-[#8a5b0a]",
  confirmed: "bg-[#d9efe9] text-[#205b4d]",
  completed: "bg-[#e6ebf5] text-[#435f95]",
  cancelled: "bg-white/12 text-[#d9e3e0]",
};

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function BookingDetails({ bookingId, onBack }: BookingDetailsProps) {
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>("requested");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadStatus("loading");

    getBooking(bookingId)
      .then((record) => {
        if (!active) return;
        setBooking(record);
        setSelectedStatus(record.status);
        setSaveStatus("idle");
        setLoadStatus("ready");
      })
      .catch(() => {
        if (active) setLoadStatus("error");
      });

    return () => {
      active = false;
    };
  }, [bookingId, reloadCount]);

  const startsAt = booking ? new Date(booking.starts_at) : null;
  const endsAt = booking ? new Date(booking.ends_at) : null;

  async function saveBookingStatus() {
    if (!booking || selectedStatus === booking.status) return;

    setSaveStatus("saving");

    try {
      const updatedBooking = await updateBooking(booking.id, {
        status: selectedStatus,
      });
      setBooking(updatedBooking);
      setSelectedStatus(updatedBooking.status);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#35685b] hover:text-[#174f40]">
        <ArrowLeft size={18} aria-hidden="true" /> Back to bookings
      </button>

      {loadStatus === "loading" && (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-[#dfe2d9] bg-white font-semibold text-[#1f765f]">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Loading booking details…
        </div>
      )}

      {loadStatus === "error" && (
        <div role="alert" className="rounded-3xl border border-[#efd1c8] bg-[#fff7f4] p-6 text-[#8d402e]">
          <div className="flex items-center gap-3 font-bold">
            <AlertCircle aria-hidden="true" /> Booking details could not be loaded
          </div>
          <p className="mt-2 text-sm">Check that the backend is running, then try again.</p>
          <button type="button" onClick={() => setReloadCount((count) => count + 1)} className="mt-4 rounded-xl bg-[#8d402e] px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      {loadStatus === "ready" && booking && startsAt && endsAt && (
        <>
          <header className="mb-6 rounded-3xl bg-[#203e3a] p-6 text-white shadow-[0_14px_34px_rgba(28,60,54,0.16)] md:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d9efe9] text-lg font-bold text-[#205b4d]">
                  {booking.student.first_name.charAt(0)}{booking.student.last_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#9fc5bb]">Booking</p>
                  <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em]">
                    {booking.student.first_name} {booking.student.last_name}
                  </h1>
                  <p className="mt-1 text-sm text-[#c7d9d5]">
                    {booking.student.year_group || "Year group not set"}
                  </p>
                </div>
              </div>
              <span className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${statusStyles[booking.status]}`}>
                {booking.status}
              </span>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#e4f2ee] text-[#1f765f]">
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold">Schedule</h2>
              </div>
              <p className="font-semibold text-[#263a35]">{dateFormatter.format(startsAt)}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-[#66736f]">
                <Clock3 size={17} aria-hidden="true" />
                {timeFormatter.format(startsAt)}–{timeFormatter.format(endsAt)}
              </p>
            </section>

            <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#e6ebf5] text-[#435f95]">
                  {booking.format === "online"
                    ? <Laptop size={18} aria-hidden="true" />
                    : <UserRound size={18} aria-hidden="true" />}
                </div>
                <h2 className="text-lg font-bold">Lesson details</h2>
              </div>
              <p className="font-semibold text-[#263a35]">
                {booking.format === "online" ? "Online lesson" : "In-person lesson"}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-[#66736f]">
                <MapPin size={17} aria-hidden="true" />
                {booking.location || (booking.format === "online" ? "No meeting link added" : "No location added")}
              </p>
            </section>

            <RescheduleBookingForm booking={booking} onUpdated={setBooking} />

            <section className="rounded-3xl border border-[#dfe2d9] bg-white p-6 shadow-[0_10px_30px_rgba(27,47,43,0.04)] md:col-span-2">
              <h2 className="text-lg font-bold">Booking status</h2>
              <p className="mt-1 text-sm text-[#66736f]">
                Keep the booking record up to date after plans change or the lesson takes place.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-sm font-semibold text-[#344a44]">
                  Status
                  <select
                    value={selectedStatus}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value as BookingStatus);
                      setSaveStatus("idle");
                    }}
                    className="mt-2 w-full rounded-xl border border-[#ccd5d0] bg-white px-3 py-2.5 text-base font-normal text-[#263a35] outline-none focus:border-[#1f765f] focus:ring-2 focus:ring-[#1f765f]/20"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={saveBookingStatus}
                  disabled={saveStatus === "saving" || selectedStatus === booking.status}
                  className="rounded-xl bg-[#1f765f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#195f4d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveStatus === "saving" ? "Saving…" : "Save status"}
                </button>
              </div>

              {saveStatus === "saved" && (
                <p role="status" className="mt-3 text-sm font-semibold text-[#1f765f]">
                  Booking status saved.
                </p>
              )}
              {saveStatus === "error" && (
                <p role="alert" className="mt-3 text-sm font-semibold text-[#9b3f2f]">
                  Booking status could not be saved. Please try again.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
