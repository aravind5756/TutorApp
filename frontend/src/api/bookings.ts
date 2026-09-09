import { apiRequest } from "./client";

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

export function getBookings(page = 1): Promise<BookingListResponse> {
  const query = page > 1 ? `?page=${page}` : "";
  return apiRequest<BookingListResponse>(`/bookings/${query}`);
}
