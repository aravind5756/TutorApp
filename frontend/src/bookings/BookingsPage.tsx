import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import {
  getBookings,
  type BookingStatus,
  type BookingSummary,
} from "../api/bookings";

const statusStyles: Record<BookingStatus, string> = {
  requested: "bg-[#fff1cf] text-[#8a5b0a]",
  confirmed: "bg-[#e4f3ed] text-[#246c58]",
  completed: "bg-[#e6ebf5] text-[#435f95]",
  cancelled: "bg-[#eceee9] text-[#68736f]",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

function BookingCard({ booking }: { booking: BookingSummary }) {
  const startsAt = new Date(booking.starts_at);
  const endsAt = new Date(booking.ends_at);
  const location = booking.format === "online"
    ? "Online"
    : booking.location || "Location not set";

  return (
    <li className="rounded-2xl border border-[#e0e2da] bg-white p-5 shadow-[0_8px_30px_rgba(27,47,43,0.04)]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-[#1f765f]">
            {dateFormatter.format(startsAt)}
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#21332f]">
            {booking.student.first_name} {booking.student.last_name}
          </h2>
          <p className="mt-1 text-sm text-[#77817e]">
            {booking.student.year_group || "Year group not set"}
          </p>
        </div>
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[booking.status]}`}>
          {booking.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#66736f]">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={16} aria-hidden="true" />
          {timeFormatter.format(startsAt)}–{timeFormatter.format(endsAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={16} aria-hidden="true" />
          {location}
        </span>
      </div>
    </li>
  );
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function loadBookings(pageToLoad: number) {
    setStatus("loading");
    try {
      const response = await getBookings(pageToLoad);
      setBookings((current) =>
        pageToLoad === 1 ? response.results : [...current, ...response.results],
      );
      setPage(pageToLoad);
      setHasMore(response.next !== null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    void loadBookings(1);
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
      <header className="mb-7">
        <p className="mb-1 text-sm font-semibold text-[#1f765f]">Lesson schedule</p>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172825] md:text-4xl">
          Bookings
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6e7a76] md:text-base">
          View requested, confirmed, and completed lessons.
        </p>
      </header>

      {status === "loading" && bookings.length === 0 && (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-[#dfe2d9] bg-white font-semibold text-[#1f765f]">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Loading bookings…
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="rounded-3xl border border-[#efd1c8] bg-[#fff7f4] p-6 text-[#8d402e]">
          <div className="flex items-center gap-3 font-bold">
            <AlertCircle aria-hidden="true" /> Bookings could not be loaded
          </div>
          <p className="mt-2 text-sm">Check that the backend is running, then try again.</p>
          <button type="button" onClick={() => void loadBookings(bookings.length ? page + 1 : 1)} className="mt-4 rounded-xl bg-[#8d402e] px-4 py-2 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && bookings.length === 0 && (
        <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#cfd5cc] bg-white p-6 text-center">
          <div>
            <CalendarDays className="mx-auto mb-4 text-[#6b817b]" size={32} aria-hidden="true" />
            <h2 className="text-lg font-bold">No bookings yet</h2>
            <p className="mt-2 text-sm text-[#77817e]">Your scheduled lessons will appear here.</p>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <>
          <p className="mb-4 text-sm font-medium text-[#66736f]">
            Showing {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
          </ul>
          {hasMore && status !== "error" && (
            <div className="mt-6 flex justify-center">
              <button type="button" disabled={status === "loading"} onClick={() => void loadBookings(page + 1)} className="rounded-xl border border-[#cfd8d1] bg-white px-4 py-2.5 text-sm font-semibold text-[#28594d] disabled:opacity-60">
                {status === "loading" ? "Loading…" : "Load more bookings"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
