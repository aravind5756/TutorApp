import { apiRequest } from "./client";

export type StudentSummary = {
  id: number;
  first_name: string;
  last_name: string;
  year_group: string;
  subjects: string;
  is_active: boolean;
};

export type StudentListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentSummary[];
};

export function getStudents(page = 1): Promise<StudentListResponse> {
  const query = page > 1 ? `?page=${page}` : "";
  return apiRequest<StudentListResponse>(`/students/${query}`);
}
