import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Image as ImageIcon,
  Newspaper,
  PenLine,
  Radio,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { AdminShell, StudioSplash } from "@/components/admin/admin-shell";
import { adminButton } from "@/components/admin/controls";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchStories } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Studio · Global Kashmir TV" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminHomeRoute,
});

type StudioPath =
  | "/admin/new"
  | "/admin/stories"
  | "/admin/schedule"
  | "/admin/live"
  | "/admin/media"
  | "/admin/settings"
  | "/admin/account";

type Task = {
  to: StudioPath;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
};

const TASKS: Task[] = [
  {
    to: "/admin/stories",
    icon: Newspaper,
    title: "Your stories",
    description: "See everything you have written. Open one to edit it, or take it off the site.",
    cta: "Open stories",
  },
  {
    to: "/admin/schedule",
    icon: CalendarDays,
    title: "Programme schedule",
    description: "Upload the picture of the programme schedule that viewers should see.",
    cta: "Update schedule",
  },
  {
    to: "/admin/live",
    icon: Radio,
    title: "Go live",
    description: "Paste your YouTube link and switch the live badge on or off.",
    cta: "Manage live",
  },
  {
    to: "/admin/media",
    icon: ImageIcon,
    title: "Photos & videos",
    description: "Every picture and video file you have uploaded, ready to reuse.",
    cta: "Open media",
  },
  {
    to: "/admin/settings",
    icon: Settings,
    title: "Website settings",
    description: "The homepage slider, contact details, the team, and the breaking ticker.",
    cta: "Open settings",
  },
  {
    to: "/admin/account",
    icon: UserRound,
    title: "Your account",
    description: "Change the password you use to sign in to the studio.",
    cta: "Open account",
  },
];

function AdminHomeRoute() {
  const { status, admin, signOut } = useAdminAuth();

  if (status !== "signed_in") {
    return (
      <StudioSplash
        label={status === "checking" ? "Checking your session" : "Redirecting to sign in"}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={signOut}>
      <Home />
    </AdminShell>
  );
}

function Home() {
  const stories = useQuery({ queryKey: ["admin", "stories"], queryFn: fetchStories });
  const total = stories.data?.meta.total;

  return (
    <>
      <div className="border-b-2 border-foreground pb-5">
        <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="mt-1 font-display text-4xl leading-none sm:text-5xl">Welcome back</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Everything you do here appears on the public site straight away. Pick what you want to do
          from the cards below.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Link
          to="/admin/new"
          className="group grid content-start gap-4 border-2 border-foreground bg-primary p-6 text-primary-foreground transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8"
        >
          <PenLine className="size-8" aria-hidden="true" />
          <h2 className="font-display text-4xl leading-none">Write a story</h2>
          <p className="max-w-prose text-sm leading-relaxed opacity-90">
            Write a headline and standfirst, add a cover picture, and publish it now or schedule it
            for later.
          </p>
          <span className="text-[10px] font-black tracking-[0.14em] uppercase">
            Start writing →
          </span>
        </Link>

        <div className="grid content-start gap-6 border-2 border-foreground bg-card p-6 sm:p-8">
          <div>
            <p className="font-display text-6xl leading-none">
              {typeof total === "number" ? total : "—"}
            </p>
            <p className="mt-2 text-[10px] font-black tracking-[0.16em] text-muted-foreground uppercase">
              {total === 1 ? "Story in the studio" : "Stories in the studio"}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A story is a news article, a feature or a video page. You can keep editing one after it
            is already live.
          </p>
          <div>
            <Link to="/admin/stories" className={adminButton({ variant: "outline", size: "sm" })}>
              See all stories
            </Link>
          </div>
        </div>
      </div>

      <h2 className="mt-12 border-b-2 border-foreground pb-2 font-display text-2xl">
        What would you like to do?
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <Link
              key={task.to}
              to={task.to}
              className={cn(
                "group grid content-start gap-3 border-2 border-foreground bg-card p-5 transition-colors",
                "hover:bg-foreground hover:text-background",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              )}
            >
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="font-display text-2xl leading-tight">{task.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-background/70">
                {task.description}
              </p>
              <span className="text-[10px] font-black tracking-[0.14em] uppercase">
                {task.cta} →
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
