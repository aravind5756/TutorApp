# TutorDesk

TutorDesk is a private operations platform for an independent tutoring practice. It is designed for one tutoring business and supports three user roles: tutor, student, and guardian.

The project is being built as a full-stack portfolio application with a React frontend, a Django REST API, and PostgreSQL.

## Planned capabilities

- Student profiles, goals, learning needs, and guardian relationships
- Availability, booking requests, approvals, rescheduling, and conflict prevention
- Lesson plans, attendance, homework, resources, and private tutor notes
- Assessments, learning targets, and progress tracking
- Guardian access to appropriate lesson, progress, and billing information
- Invoices, payments, receipts, and overdue reminders
- Automated booking and progress communications
- Audit history for sensitive student, scheduling, and billing changes

## Technology stack

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- pytest

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest and Playwright

## Repository structure

```text
TutorApp/
├── backend/       # Django application and REST API
├── frontend/      # React and TypeScript application
├── .env.example  # Documented environment variables
└── README.md
```

The backend and frontend will be developed as separate applications in one repository. Django will remain responsible for authentication, authorization, business rules, and persistence. React will provide the browser interface.

## Initial development roadmap

1. Scaffold and test the Django backend.
2. Add the custom user model and tutor, student, and guardian roles.
3. Configure PostgreSQL and the REST API foundation.
4. Scaffold the React frontend and connect it to Django.
5. Implement session authentication and protected routes.
6. Build student management as the first end-to-end product feature.
7. Add guardian relationships, bookings, and lesson records.
