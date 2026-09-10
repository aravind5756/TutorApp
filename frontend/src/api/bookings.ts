import { apiRequest } from "./client";
import { getCsrfToken } from "./auth";

export type BookingStudent = {
  id: number;
  first_name: string;
  last_name: string;
  year_group: string;
};

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled";

export type BookingFormat = "online" | "in_person";

export type BookingSummary = {
  id: number;
  student: BookingStudent;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  format: BookingFormat;
  location: string;
};

export type BookingListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BookingSummary[];
};

export type NewBooking = {
  student: number;
  starts_at: string;
  ends_at: string;
  format: BookingFormat;
  location?: string;
  status?: BookingStatus;
};

export type BookingUpdates = Partial<NewBooking>;

export function getBookings(page = 1): Promise<BookingListResponse> {
  const query = page > 1 ? `?page=${page}` : "";
  return apiRequest<BookingListResponse>(`/bookings/${query}`);
}

export function getBooking(bookingId: number): Promise<BookingSummary> {
  return apiRequest<BookingSummary>(`/bookings/${bookingId}/`);
}

export async function createBooking(
  booking: NewBooking,
): Promise<BookingSummary> {
  const token = await getCsrfToken();

  return apiRequest<BookingSummary>("/bookings/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(booking),
  });
}

export async function updateBooking(
  bookingId: number,
  updates: BookingUpdates,
): Promise<BookingSummary> {
  const token = await getCsrfToken();

  return apiRequest<BookingSummary>(`/bookings/${bookingId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(updates),
  });
}
