import { useState } from "react";
import { LoginPage } from "./auth/LoginPage";
import { SignOutButton } from "./auth/SignOutButton";
import { useAuth } from "./auth/useAuth";
import { BookingsPage } from "./bookings/BookingsPage";
import { StudentsPage } from "./students/StudentsPage";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  LoaderCircle,
  Plus,
  Search,
  Settings,
  TrendingUp,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  followUps,
  progressItems,
  summaryMetrics,
  todaysLessons,
} from "./mocks/dashboard";
import {
  useBackendHealth,
  type BackendStatus,
} from "./hooks/useBackendHealth";

type NavItem = {
  label: string;
  icon: LucideIcon;
};

type Page = "Dashboard" | "Students" | "Bookings";

const navigation: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Students", icon: UsersRound },
  { label: "Bookings", icon: CalendarDays },
  { label: "Lessons", icon: BookOpen },
  { label: "Progress", icon: TrendingUp },
  { label: "Invoices", icon: FileText },
  { label: "Messages", icon: MessageSquareText },
];

const toneStyles = {
  teal: "bg-[#daf3ed] text-[#126653]",
  navy: "bg-[#e1e8f4] text-[#243c68]",
  amber: "bg-[#fff0cc] text-[#8a5a08]",
  coral: "bg-[#ffe2d8] text-[#9a442f]",
};

const lessonAccent = {
  teal: "bg-[#1f8a70]",
  blue: "bg-[#4c6fae]",
  amber: "bg-[#dda431]",
};

const backendStatusDisplay = {
  checking: {
    label: "Connecting to system",
    icon: LoaderCircle,
    iconClassName: "animate-spin text-[#f4c85b]",
  },
  online: {
    label: "System online",
    icon: Wifi,
    iconClassName: "text-[#75d6b7]",
  },
  offline: {
    label: "System unavailable",
    icon: WifiOff,
    iconClassName: "text-[#f09a80]",
  },
};

function Sidebar({
  backendStatus,
  activePage,
  onSelectPage,
  onNavigate,
}: {
  backendStatus: BackendStatus;
  activePage: Page;
  onSelectPage: (page: Page) => void;
  onNavigate?: () => void;
}) {
  const statusDisplay = backendStatusDisplay[backendStatus];
  const StatusIcon = statusDisplay.icon;
  const { user } = useAuth();
  const displayName = user?.first_name.trim() || user?.email || "Tutor";
  const initials = `${user?.first_name.charAt(0) || user?.email.charAt(0) || "T"}${user?.last_name.charAt(0) || ""}`.toUpperCase();

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-[#142b2b] px-4 py-5 text-white">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-xl bg-[#f4c85b] text-[#142b2b] shadow-[0_8px_22px_rgba(244,200,91,0.18)]">
          <GraduationCap size={22} strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-lg font-bold tracking-[-0.03em]">TutorDesk</p>
          <p className="text-xs text-[#a9c0bd]">Operations hub</p>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="space-y-1">
        {navigation.map(({ label, icon: Icon }) => {
          const isActive = label === activePage;
          const isAvailable = label === "Dashboard" || label === "Students" || label === "Bookings";
          return (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              onClick={(event) => {
                if (isAvailable) {
                  event.preventDefault();
                  onSelectPage(label as Page);
                }
                onNavigate?.();
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/12 text-white"
                  : "text-[#bdd0cd] hover:bg-white/7 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.9} />
              {label}
              {label === "Messages" && (
                <span className="ml-auto rounded-full bg-[#f4c85b] px-2 py-0.5 text-[11px] font-bold text-[#142b2b]">
                  2
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div
          className="mb-3 flex items-center gap-2 px-3 text-xs font-medium text-[#a9c0bd]"
          role="status"
          aria-live="polite"
        >
          <StatusIcon
            size={14}
            strokeWidth={2}
            className={statusDisplay.iconClassName}
          />
          {statusDisplay.label}
        </div>
        <a
          href="#settings"
          className="mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#bdd0cd] hover:bg-white/7 hover:text-white"
        >
          <Settings size={18} strokeWidth={1.9} />
          Settings
        </a>
        <div className="rounded-2xl border border-white/8 bg-white/6 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#d9efe9] text-sm font-bold text-[#205b4d]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-[#9fb7b3]">Tutor account</p>
            </div>
            <ChevronRight size={16} className="text-[#8da7a3]" />
          </div>
        </div>
        <div className="mt-3 text-[#bdd0cd]"><SignOutButton /></div>
      </div>
    </aside>
  );
}

function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const backendStatus = useBackendHealth();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f3ee] text-[#172825]">
      <div className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar backendStatus={backendStatus} activePage={activePage} onSelectPage={setActivePage} />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#071312]/55 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative h-full w-72 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-5 z-10 rounded-lg p-1.5 text-[#bdd0cd] hover:bg-white/10 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
            <Sidebar
              backendStatus={backendStatus}
              activePage={activePage}
              onSelectPage={setActivePage}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:ml-64">
        <header className="flex h-18 items-center justify-between border-b border-[#dfe1d8] bg-[#f8f7f2]/90 px-5 backdrop-blur md:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-[#d7dbd1] bg-white p-2 text-[#324945] lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-[#dfe2d9] bg-white px-3 py-2 text-[#75817e] shadow-sm sm:flex">
              <Search size={17} />
              <span className="w-40 text-sm">Search students…</span>
              <kbd className="rounded-md bg-[#f1f2ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#7d8581]">
                ⌘ K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-xl border border-[#dfe2d9] bg-white p-2.5 text-[#52635f] shadow-sm hover:text-[#1f6f5d]"
              aria-label="View notifications"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#dd7559]" />
            </button>
            <button
              type="button"
              className="ml-1 inline-flex items-center gap-2 rounded-xl bg-[#1f765f] px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(31,118,95,0.18)] hover:bg-[#185f4d]"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New booking</span>
            </button>
          </div>
        </header>

        {activePage === "Students" ? <StudentsPage /> : activePage === "Bookings" ? <BookingsPage /> : <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
          <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-sm font-semibold text-[#1f765f]">
                Saturday, 29 August
              </p>
              <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172825] md:text-4xl">
                Welcome back, {user?.first_name.trim() || user?.email}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e7a76] md:text-base">
                You have three lessons today. Everything else is looking nicely
                under control.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cddfd9] bg-[#e9f5f1] px-3 py-1.5 text-xs font-semibold text-[#256955]">
              <span className="size-2 rounded-full bg-[#2a9b7c]" />
              Schedule up to date
            </div>
          </section>

          <section aria-label="Weekly summary" className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-[#e0e2da] bg-white p-5 shadow-[0_8px_30px_rgba(27,47,43,0.04)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <p className="text-sm font-medium text-[#697671]">{metric.label}</p>
                  <span className={`size-2.5 rounded-full ${toneStyles[metric.tone].split(" ")[0]}`} />
                </div>
                <p className="text-3xl font-bold tracking-[-0.04em]">{metric.value}</p>
                <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[metric.tone]}`}>
                  {metric.detail}
                </p>
              </article>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <section className="overflow-hidden rounded-3xl border border-[#dfe2d9] bg-white shadow-[0_12px_36px_rgba(27,47,43,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e7e8e2] px-5 py-5 md:px-6">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.02em]">Today’s lessons</h2>
                  <p className="mt-1 text-sm text-[#77817e]">Three hours of teaching scheduled</p>
                </div>
                <button type="button" className="text-sm font-semibold text-[#1f765f] hover:text-[#155744]">
                  View calendar
                </button>
              </div>
              <div className="divide-y divide-[#ecece7]">
                {todaysLessons.map((lesson) => (
                  <article key={lesson.id} className="group flex gap-4 px-5 py-5 transition-colors hover:bg-[#fafbf8] md:gap-5 md:px-6">
                    <div className="w-12 shrink-0 pt-0.5 text-right md:w-14">
                      <p className="text-sm font-bold">{lesson.time}</p>
                      <p className="mt-1 text-xs text-[#8a9490]">{lesson.endTime}</p>
                    </div>
                    <div className={`w-1 shrink-0 rounded-full ${lessonAccent[lesson.colour]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="font-bold text-[#21332f]">{lesson.student}</h3>
                          <p className="mt-1 text-sm text-[#66736f]">
                            {lesson.subject} <span className="text-[#b2b8b5]">·</span> {lesson.yearGroup}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lesson.status === "Confirmed"
                            ? "bg-[#e4f3ed] text-[#246c58]"
                            : "bg-[#fff1cf] text-[#8a5b0a]"
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-[#7a8581]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} /> 60 minutes
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={14} /> {lesson.location}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="mt-1 hidden shrink-0 text-[#b5bcb9] transition-transform group-hover:translate-x-0.5 sm:block" />
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
              <section className="rounded-3xl border border-[#dfe2d9] bg-white p-5 shadow-[0_12px_36px_rgba(27,47,43,0.05)] md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.02em]">Follow-ups</h2>
                    <p className="mt-1 text-sm text-[#77817e]">Keep students moving forward</p>
                  </div>
                  <span className="grid size-8 place-items-center rounded-full bg-[#ffe6dd] text-sm font-bold text-[#a24a33]">3</span>
                </div>
                <div className="space-y-4">
                  {followUps.map((item) => (
                    <article key={item.id} className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf0e9] text-xs font-bold text-[#53645f]">
                        {item.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.student}</p>
                        <p className="truncate text-xs text-[#7a8581]">{item.reason}</p>
                      </div>
                      <span className={`text-xs font-semibold ${item.due === "Overdue" ? "text-[#b1533c]" : "text-[#7a8581]"}`}>
                        {item.due}
                      </span>
                    </article>
                  ))}
                </div>
                <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe3db] py-2.5 text-sm font-semibold text-[#35504a] hover:bg-[#f7f8f4]">
                  <Check size={16} /> Manage tasks
                </button>
              </section>

              <section className="rounded-3xl bg-[#203e3a] p-5 text-white shadow-[0_14px_34px_rgba(28,60,54,0.16)] md:p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9fc5bb]">Student progress</p>
                    <h2 className="mt-1 text-lg font-bold">Targets at a glance</h2>
                  </div>
                  <div className="grid size-9 place-items-center rounded-xl bg-white/10 text-[#f4c85b]">
                    <TrendingUp size={19} />
                  </div>
                </div>
                <div className="space-y-4">
                  {progressItems.map((item) => (
                    <article key={item.student}>
                      <div className="mb-2 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.student}</p>
                          <p className="text-xs text-[#aac3be]">{item.subject}</p>
                        </div>
                        <p className="text-xs font-semibold text-[#d6e3e0]">{item.target}</p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
                        <div className="h-full rounded-full bg-[#f4c85b]" style={{ width: `${item.progress}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="flex items-center gap-4 rounded-2xl border border-[#e0e2da] bg-white p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-[#e4f2ee] text-[#1f765f]"><CalendarDays size={19} /></div>
              <div><p className="text-xs font-medium text-[#7a8581]">Next exam</p><p className="text-sm font-bold">GCSE Maths · 18 days</p></div>
            </article>
            <article className="flex items-center gap-4 rounded-2xl border border-[#e0e2da] bg-white p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-[#fff0cf] text-[#96630c]"><CircleDollarSign size={19} /></div>
              <div><p className="text-xs font-medium text-[#7a8581]">Last payment</p><p className="text-sm font-bold">£120 received yesterday</p></div>
            </article>
            <article className="flex items-center gap-4 rounded-2xl border border-[#e0e2da] bg-white p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-[#e6ebf5] text-[#435f95]"><BookOpen size={19} /></div>
              <div><p className="text-xs font-medium text-[#7a8581]">Homework returned</p><p className="text-sm font-bold">14 of 16 this week</p></div>
            </article>
          </section>
        </div>}
      </main>
    </div>
  );
}

export default function App() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f3ee] text-[#1f765f]">
        <p role="status" className="flex items-center gap-3 font-semibold">
          <LoaderCircle className="animate-spin" aria-hidden="true" /> Checking your session…
        </p>
      </main>
    );
  }

  if (status !== "authenticated" || !user) return <LoginPage />;

  if (user.role !== "tutor") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f3ee] p-6 text-[#172825]">
        <section className="w-full max-w-md rounded-3xl border border-[#dfe2d9] bg-white p-8">
          <GraduationCap size={32} className="mb-6 text-[#1f765f]" aria-hidden="true" />
          <p className="mb-2 text-sm font-semibold capitalize text-[#1f765f]">{user.role} account</p>
          <h1 className="text-2xl font-bold">Your portal is not available yet</h1>
          <p className="my-5 text-sm leading-6 text-[#66736f]">You are signed in as {user.email}. Your student or guardian portal is still being built. Please check with your tutor for updates.</p>
          <SignOutButton />
        </section>
      </main>
    );
  }

  return <Dashboard />;
}
