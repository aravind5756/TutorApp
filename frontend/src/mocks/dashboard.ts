import type {
  FollowUp,
  Lesson,
  ProgressItem,
  SummaryMetric,
} from "../types/dashboard";

export const summaryMetrics: SummaryMetric[] = [
  {
    label: "Lessons this week",
    value: "12",
    detail: "3 remaining today",
    tone: "teal",
  },
  {
    label: "Active students",
    value: "18",
    detail: "2 joined this month",
    tone: "navy",
  },
  {
    label: "Awaiting payment",
    value: "£340",
    detail: "Across 4 invoices",
    tone: "amber",
  },
  {
    label: "Need follow-up",
    value: "3",
    detail: "1 overdue action",
    tone: "coral",
  },
];

export const todaysLessons: Lesson[] = [
  {
    id: 1,
    time: "10:00",
    endTime: "11:00",
    student: "Maya Thompson",
    subject: "GCSE Mathematics",
    yearGroup: "Year 11",
    location: "Online",
    status: "Confirmed",
    colour: "teal",
  },
  {
    id: 2,
    time: "14:30",
    endTime: "15:30",
    student: "Ethan Williams",
    subject: "A-level Physics",
    yearGroup: "Year 12",
    location: "Home visit",
    status: "Confirmed",
    colour: "blue",
  },
  {
    id: 3,
    time: "17:00",
    endTime: "18:00",
    student: "Sofia Patel",
    subject: "GCSE Mathematics",
    yearGroup: "Year 10",
    location: "Online",
    status: "Awaiting approval",
    colour: "amber",
  },
];

export const followUps: FollowUp[] = [
  {
    id: 1,
    student: "Noah Clarke",
    reason: "Send mock exam feedback",
    due: "Overdue",
    initials: "NC",
  },
  {
    id: 2,
    student: "Olivia Evans",
    reason: "Confirm Easter availability",
    due: "Today",
    initials: "OE",
  },
  {
    id: 3,
    student: "Jacob Reed",
    reason: "Review new learning target",
    due: "Tomorrow",
    initials: "JR",
  },
];

export const progressItems: ProgressItem[] = [
  {
    student: "Maya Thompson",
    subject: "Algebra fluency",
    progress: 78,
    target: "Target 85%",
  },
  {
    student: "Ethan Williams",
    subject: "Mechanics assessment",
    progress: 64,
    target: "Target 75%",
  },
  {
    student: "Sofia Patel",
    subject: "Number skills",
    progress: 86,
    target: "Target 80%",
  },
];
