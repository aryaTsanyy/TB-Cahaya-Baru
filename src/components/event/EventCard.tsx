import Link from "next/link";

export type EventStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "pending_validation"
  | "validated";

export interface EventCardData {
  id: string;
  title: string;
  riverName: string;
  dateLabel: string;
  timeLabel: string;
  status: EventStatus;
  participantCount: number;
  maxParticipants: number | null;
  imageUrl?: string | null;
  pointsLabel?: string;
}

interface StatusConfig {
  label: string;
  pillBg: string;
  pillText: string;
}

const STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  active: {
    label: "Live",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-700",
  },
  upcoming: {
    label: "Mendatang",
    pillBg: "bg-sky-100",
    pillText: "text-sky-700",
  },
  completed: {
    label: "Selesai",
    pillBg: "bg-slate-100",
    pillText: "text-slate-600",
  },
  pending_validation: {
    label: "Validasi",
    pillBg: "bg-amber-100",
    pillText: "text-amber-700",
  },
  validated: {
    label: "Selesai",
    pillBg: "bg-slate-100",
    pillText: "text-slate-600",
  },
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=70";

interface EventCardProps {
  event: EventCardData;
  href?: string;
}

export default function EventCard({ event, href }: EventCardProps) {
  const config = STATUS_CONFIG[event.status];
  const linkHref = href ?? `/events/${event.id}`;
  const imageUrl = event.imageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <article className="rounded-3xl bg-white overflow-hidden shadow-sm">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
          {event.title}
        </h3>
        <span
          className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${config.pillBg} ${config.pillText}`}
        >
          {config.label}
        </span>
      </div>

      <div className="px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full aspect-[16/10] object-cover rounded-2xl"
        />
      </div>

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900 tabular-nums">
              {event.participantCount}
            </span>
            <span className="text-slate-400">
              /{event.maxParticipants ?? "∞"}
            </span>{" "}
            <span className="text-slate-600">Pasukan Kali</span>
          </p>
          {event.pointsLabel && (
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">
              {event.pointsLabel}
            </span>
          )}
        </div>

        <Link
          href={linkHref}
          className="block w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold text-center hover:bg-slate-800 active:scale-[0.99] transition-all"
        >
          Daftar
        </Link>
      </div>
    </article>
  );
}
