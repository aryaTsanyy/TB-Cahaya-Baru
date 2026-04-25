import Link from "next/link";
import type { EventStatus } from "@/components/event/EventCard";

export interface LeaderEventCardData {
  id: string;
  title: string;
  participantCount: number;
  maxParticipants: number | null;
  imageUrl: string | null;
  pointsPerHunter: number | null;
  status: EventStatus;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=70";

interface EventCardLeaderProps {
  event: LeaderEventCardData;
}

export default function EventCardLeader({ event }: EventCardLeaderProps) {
  const imageUrl = event.imageUrl ?? PLACEHOLDER_IMAGE;
  const pointsLabel =
    event.pointsPerHunter !== null ? `${event.pointsPerHunter} point` : "Auto";

  return (
    <article className="rounded-3xl bg-white overflow-hidden shadow-sm">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
          {event.title}
        </h3>
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
            <span className="text-slate-600">Penggerak Aksi</span>
          </p>
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">
            {pointsLabel}
          </span>
        </div>

        <Link
          href={`/events/${event.id}/manage`}
          className="block w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold text-center hover:bg-slate-800 active:scale-[0.99] transition-all"
        >
          Ubah
        </Link>
      </div>
    </article>
  );
}
