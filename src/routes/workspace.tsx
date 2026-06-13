import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, GraduationCap, Building2, Users, Brain, BarChart3,
  CalendarCheck, Wallet, BookOpen, ShieldCheck, Video, FileText, Image as ImageIcon,
  Bot, Database, Activity, CheckCircle2, Lock,
} from "lucide-react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Axion Workspace — AI for Teachers, Schools, Teams & Businesses" },
      { name: "description", content: "An AI operating system for modern organizations. Manage teams, classrooms, projects, knowledge, and documents in one secure platform." },
      { property: "og:title", content: "Axion Workspace" },
      { property: "og:description", content: "The AI Workspace for Modern Organizations." },
    ],
  }),
  component: WorkspacePage,
});

const teacherFeatures = [
  "AI lesson plans", "Worksheets", "Question papers", "Automatic answer keys",
  "Assignment creation", "Attendance tracking", "Student profiles & logins",
  "Gradebook", "Parent communication", "AI report cards",
  "Classroom announcements", "Exam planner", "Quiz generator", "AI presentations",
];

const studentFeatures = [
  "Today's classes", "Homework & assignments", "AI Tutor",
  "Smart notes", "Flashcards", "Study planner", "Exam mode",
  "Practice tests", "Confidence tracker", "Weak-topic insights",
];

const parentFeatures = [
  "Live attendance", "Grades & report cards", "Homework status",
  "Upcoming exams & events", "Message teachers", "Book appointments",
  "Performance trends", "Emergency alerts", "Parent AI assistant",
];

const friendsFeatures = [
  "Shared chat & voice rooms", "Shared notes & whiteboard", "Shared calendar",
  "Polls & countdowns", "Movie & travel planner", "Expense splitter",
  "Birthday reminders", "Group AI assistant", "Shared playlists",
];

const businessFeatures = [
  "Team workspace", "Departments (HR, Finance, …)", "Project Kanban",
  "Tasks & deadlines", "Expense management", "AI meeting summaries",
  "Knowledge base with RAG", "Google Meet integration", "Analytics dashboard",
  "Permission management", "Activity logs", "AI reports & emails",
];

const groupFor = ["Friends", "Clubs", "NGOs", "Developers", "Startups", "Families"];


function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 grid grid-cols-1 gap-2 text-sm text-muted-foreground">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function WorkspaceCard({
  icon: Icon, emoji, title, description, features, button, extra,
}: {
  icon: typeof GraduationCap;
  emoji: string;
  title: string;
  description: string;
  features: string[];
  button: string;
  extra?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-card-gradient border border-border/60 rounded-3xl p-7 shadow-soft hover:shadow-elevated transition-soft flex flex-col"
    >
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center text-2xl">
          {emoji}
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Icon className="size-4 text-primary" /> {title}
          </h3>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{description}</p>
      {extra}
      <FeatureList items={features} />
      <Link
        to="/workspaces"
        className="mt-6 inline-flex h-11 px-5 items-center justify-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft"
      >
        {button} <ArrowRight className="size-4" />
      </Link>

    </motion.div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BarChart3 }) {
  return (
    <div className="bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-12">
      <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
        <Sparkles className="size-3.5 text-primary" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function FloatingHeroCards() {
  const cards = [
    { icon: Bot, label: "AI Assistant", x: "-left-4", y: "top-10", delay: 0 },
    { icon: BarChart3, label: "Analytics", x: "-right-4", y: "top-24", delay: 0.2 },
    { icon: FileText, label: "Projects", x: "-left-2", y: "bottom-20", delay: 0.4 },
    { icon: Users, label: "Collaboration", x: "-right-2", y: "bottom-8", delay: 0.6 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{ duration: 4, delay: c.delay, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${c.x} ${c.y} glass border border-border/60 rounded-2xl px-4 py-3 shadow-soft flex items-center gap-2`}
        >
          <c.icon className="size-4 text-primary" />
          <span className="text-sm font-medium">{c.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="px-6 md:px-10 pt-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground font-bold shadow-glow">A6</div>
          <span className="font-semibold tracking-tight text-lg">Axion Workspace</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className="hidden sm:inline-flex h-10 px-4 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-soft">
            Back to Axion
          </Link>
          <Link to="/workspaces" className="inline-flex h-10 px-5 items-center rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-20 pb-28 max-w-6xl mx-auto w-full">
        <div className="absolute inset-0 ambient-grain -z-10 opacity-80" />
        <div className="relative">
          <FloatingHeroCards />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Building2 className="size-3.5 text-primary" />
              <span>Axion Workspace</span>
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              The AI Workspace for <span className="text-primary">Modern Organizations</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Manage teams, classrooms, projects, knowledge, meetings, documents, and AI assistants from one secure platform.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link to="/workspaces" className="inline-flex h-12 px-6 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft">
                Get started — it's free <ArrowRight className="size-4" />
              </Link>
              <Link to="/" className="inline-flex h-12 px-6 items-center rounded-2xl glass border border-border/60 font-medium hover:bg-card transition-soft">
                Back to Axion
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground/80">100% free · No credit card · Separate from Axion</p>

          </motion.div>
        </div>
      </section>

      {/* Five Workspace Types */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full">
        <SectionHeader
          eyebrow="One Platform. Unlimited Workspaces."
          title="A workspace for every kind of team"
          subtitle="Collaborate with AI, manage projects, attend meetings, share files, and stay connected from anywhere."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WorkspaceCard
            icon={GraduationCap}
            emoji="🎓"
            title="Teacher Workspace"
            description="For schools, tuition centers, and educators. Create student profiles, run classes, and let AI handle the busywork."
            features={teacherFeatures}
            button="Create Teacher Space"
          />
          <WorkspaceCard
            icon={BookOpen}
            emoji="📚"
            title="Student Workspace"
            description="Sign in with the username your teacher creates. Get an AI tutor, smart notes, planner and exam mode."
            features={studentFeatures}
            button="Join as Student"
          />
          <WorkspaceCard
            icon={Users}
            emoji="👨‍👩‍👧"
            title="Parent Workspace"
            description="Monitor attendance, grades, fees, and events. Message teachers and book appointments in one place."
            features={parentFeatures}
            button="Open Parent Space"
          />
          <WorkspaceCard
            icon={Users}
            emoji="👥"
            title="Friends Workspace"
            description="A private collaborative space for your group — chats, plans, voice rooms, polls and a shared AI."
            features={friendsFeatures}
            button="Create with Friends"
            extra={
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Perfect for</p>
                <div className="flex flex-wrap gap-1.5">
                  {groupFor.map((g) => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{g}</span>
                  ))}
                </div>
              </div>
            }
          />
          <WorkspaceCard
            icon={Building2}
            emoji="🏢"
            title="Business Workspace"
            description="A complete AI operating system for startups, companies, and enterprises. Departments, projects, knowledge & analytics."
            features={businessFeatures}
            button="Start Business"
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-border/60 bg-hero p-7 shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center text-2xl">✨</div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">Create your own</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Name it, pick a logo, cover, theme, and privacy
                <span className="block mt-2 text-xs">Public · Private · Invite only · Organization only</span>
              </p>
              <ul className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
                <li>• Shared AI, storage, calendar, notes, tasks</li>
                <li>• Whiteboard, files, announcements, templates</li>
                <li>• Activity timeline, search, notifications</li>
                <li>• Roles: Owner → Admin → Moderator → Member → Guest</li>
              </ul>
            </div>
            <Link
              to="/workspaces"
              className="mt-6 inline-flex h-11 px-5 items-center justify-center gap-2 rounded-2xl glass border border-border/60 font-medium hover:bg-card transition-soft"
            >
              Create Workspace <ArrowRight className="size-4" />
            </Link>

          </motion.div>
        </div>
      </section>


      {/* Analytics Dashboard */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full">
        <SectionHeader eyebrow="Live insights" title="Analytics Dashboard" subtitle="Today's activity, at a glance." />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Stat label="Users Online" value="248" icon={Users} />
          <Stat label="AI Requests" value="12,840" icon={Bot} />
          <Stat label="Projects Active" value="36" icon={FileText} />
          <Stat label="Assignments" value="92" icon={BookOpen} />
          <Stat label="Tasks Completed" value="1,204" icon={CheckCircle2} />
          <Stat label="Storage Used" value="184 GB" icon={Database} />
          <Stat label="Meetings Today" value="18" icon={Video} />
          <Stat label="Docs Generated" value="312" icon={FileText} />
          <Stat label="Images Generated" value="148" icon={ImageIcon} />
          <Stat label="Videos Generated" value="22" icon={Video} />
          <Stat label="Active Sessions" value="412" icon={Activity} />
          <Stat label="AI Accuracy" value="98.6%" icon={Sparkles} />
        </div>
      </section>

      {/* Attendance + Expense */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center"><CalendarCheck className="size-5" /></div>
            <h3 className="text-xl font-semibold tracking-tight">Attendance Tracking</h3>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            <div className="rounded-xl bg-background/60 p-3 text-center"><div className="text-2xl font-semibold">128</div><div className="text-xs text-muted-foreground">Present</div></div>
            <div className="rounded-xl bg-background/60 p-3 text-center"><div className="text-2xl font-semibold">7</div><div className="text-xs text-muted-foreground">Absent</div></div>
            <div className="rounded-xl bg-background/60 p-3 text-center"><div className="text-2xl font-semibold">3</div><div className="text-xs text-muted-foreground">Late</div></div>
            <div className="rounded-xl bg-primary/10 p-3 text-center"><div className="text-2xl font-semibold text-primary">96%</div><div className="text-xs text-muted-foreground">Rate</div></div>
          </div>
          <FeatureList items={["Daily attendance", "Monthly attendance", "QR check-in", "Manual check-in", "Late arrivals", "Early departures", "Attendance analytics", "Export CSV/PDF", "AI attendance insights"]} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Wallet className="size-5" /></div>
            <h3 className="text-xl font-semibold tracking-tight">Expense Management</h3>
          </div>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {["Travel", "Office", "Software", "Marketing", "Food", "Utilities", "Miscellaneous"].map((c) => (
              <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{c}</span>
            ))}
          </div>
          <FeatureList items={["Add expenses", "Upload receipts", "Categories", "Budgets", "Monthly reports", "Charts", "AI spending analysis", "Approval workflow", "Export PDF", "Export Excel"]} />
        </motion.div>
      </section>

      {/* Knowledge Base */}
      <section className="px-6 md:px-10 pb-24 max-w-5xl mx-auto w-full">
        <SectionHeader eyebrow="Your organization's brain" title="AI-Powered Knowledge Base" subtitle="Upload your documents. Axion answers questions using only your knowledge, with citations." />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-7 shadow-soft">
            <div className="flex items-center gap-3 mb-3"><Brain className="size-5 text-primary" /><h3 className="font-semibold">Capabilities</h3></div>
            <FeatureList items={["Upload PDFs, DOCX, PPT, images", "Upload policies, textbooks, manuals", "Semantic search", "Automatic indexing", "AI summaries", "Version history", "Tags & categories", "Role-based access", "Citations to source documents"]} />
          </div>
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-7 shadow-soft space-y-4">
            <div className="rounded-2xl bg-background/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">User</p>
              <p className="text-sm">What is our leave policy?</p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="text-xs text-primary mb-1">Axion AI</p>
              <p className="text-sm">According to the uploaded HR policy, employees receive 18 paid days per year...</p>
            </div>
            <div className="rounded-2xl bg-background/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">User</p>
              <p className="text-sm">When is the biology exam?</p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="text-xs text-primary mb-1">Axion AI</p>
              <p className="text-sm">According to the uploaded academic calendar, the biology exam is on March 14.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin + Security */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-6">
        <div className="bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><h3 className="text-xl font-semibold tracking-tight">Admin Dashboard</h3></div>
          <FeatureList items={["Add, remove, suspend users", "Assign roles", "Manage permissions", "Manage AI models", "View audit logs", "Manage billing", "Manage storage", "Create announcements", "Manage workspaces"]} />
        </div>
        <div className="bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-3"><Lock className="size-5 text-primary" /><h3 className="text-xl font-semibold tracking-tight">Security</h3></div>
          <FeatureList items={["Two-factor authentication", "Single Sign-On", "End-to-end encryption where applicable", "Device management", "Session management", "Role-based access control", "Backup & restore", "Audit logs"]} />
        </div>
      </section>

      {/* Free CTA */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-hero p-10 md:p-14 text-center shadow-elevated">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to start?</h2>
          <p className="mt-4 text-muted-foreground">
            Every workspace, every feature — completely free.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/workspaces" className="inline-flex h-12 px-7 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft">
              Create your workspace <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80">No credit card · No paid tiers</p>
        </div>
      </section>


      <Footer />
    </div>
  );
}
