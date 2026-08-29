export type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "navy" | "amber" | "coral";
};

export type Lesson = {
  id: number;
  time: string;
  endTime: string;
  student: string;
  subject: string;
  yearGroup: string;
  location: string;
  status: "Confirmed" | "Awaiting approval";
  colour: "teal" | "blue" | "amber";
};

export type FollowUp = {
  id: number;
  student: string;
  reason: string;
  due: string;
  initials: string;
};

export type ProgressItem = {
  student: string;
  subject: string;
  progress: number;
  target: string;
};
