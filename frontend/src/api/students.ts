import { apiRequest } from "./client";
import { getCsrfToken } from "./auth";

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

export type StudentDetail = StudentSummary & {
  goals: string;
  learning_needs: string;
  created_at: string;
  updated_at: string;
};

export type NewStudent = Pick<
  StudentSummary,
  "first_name" | "last_name" | "year_group" | "subjects"
>;

export type StudentUpdates = Partial<
  Pick<
    StudentDetail,
    | "first_name"
    | "last_name"
    | "year_group"
    | "subjects"
    | "goals"
    | "learning_needs"
    | "is_active"
  >
>;

export function getStudents(page = 1): Promise<StudentListResponse> {
  const query = page > 1 ? `?page=${page}` : "";
  return apiRequest<StudentListResponse>(`/students/${query}`);
}

export function getStudent(studentId: number): Promise<StudentDetail> {
  return apiRequest<StudentDetail>(`/students/${studentId}/`);
}

export async function updateStudent(
  studentId: number,
  updates: StudentUpdates,
): Promise<StudentDetail> {
  const token = await getCsrfToken();

  return apiRequest<StudentDetail>(`/students/${studentId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(updates),
  });
}

export async function createStudent(student: NewStudent): Promise<StudentSummary> {
  const token = await getCsrfToken();

  return apiRequest<StudentSummary>("/students/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    },
    body: JSON.stringify(student),
  });
}
