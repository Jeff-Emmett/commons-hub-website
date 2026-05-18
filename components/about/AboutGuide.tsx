'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SectionNav } from '@/components/SectionNav';

export interface TeamMember {
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
}

const SECTIONS = [
  { id: 'team', label: 'Team' },
  { id: 'community', label: 'Community' },
  { id: 'history', label: 'History' },
  { id: 'contact', label: 'Contact' },
];

export function AboutGuide({ team }: { team: TeamMember[] }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
      <SectionNav sections={SECTIONS} />

      <div className="flex-1 min-w-0 space-y-20">
        <section id="team" className="scroll-mt-28">
          <h2 className="h1 mb-8">Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {team.map((m) => (
              <div key={m.name} className="flex gap-4">
                <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-slate-200">
                  {m.imageUrl && (
                    <Image
                      src={m.imageUrl}
                      alt={m.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{m.name}</h3>
                  {m.role && <p className="text-sm text-slate-500 mb-1">{m.role}</p>}
                  {m.bio && (
                    <div
                      className="text-sm text-slate-700 about-bio"
                      dangerouslySetInnerHTML={{ __html: m.bio }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="community" className="scroll-mt-28">
          <h2 className="h1 mb-6">Community</h2>
          <p className="text-lg text-slate-700 mb-4">
            The commons hub harbors artists, dreamers, hackers and tinkerers —
            together with the partners and sponsors who make the place possible.
          </p>
          <Link
            href="/page/community"
            className="text-slate-900 font-medium hover:underline"
          >
            Partners, sponsors &amp; the wider community →
          </Link>
        </section>

        <section id="history" className="scroll-mt-28">
          <h2 className="h1 mb-6">History</h2>
          <p className="text-lg text-slate-700">
            From a former guesthouse in Hirschwang to a communal hub for
            regenerative systems design — the building has been reshaped, event
            by event, by the people who pass through it.
          </p>
        </section>

        <section id="contact" className="scroll-mt-28">
          <h2 className="h1 mb-6">Contact</h2>
          <address className="not-italic text-lg text-slate-700 leading-relaxed">
            Commons Hub<br />
            Richard von Schoeller-Straße 9<br />
            2651 Reichenau an der Rax<br />
            Austria<br />
            <a
              className="text-slate-900 font-medium hover:underline"
              href="mailto:office@commons-hub.at"
            >
              office@commons-hub.at
            </a>
          </address>
        </section>
      </div>
    </div>
  );
}
