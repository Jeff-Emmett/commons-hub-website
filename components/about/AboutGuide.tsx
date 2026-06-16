'use client';

import { SectionNav } from '@/components/SectionNav';
import { TeamSlider } from '@/components/about/TeamSlider';

export interface TeamMember {
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
}

const SECTIONS = [
  { id: 'team', label: 'Team' },
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
          <TeamSlider team={team} />
        </section>

        <section id="history" className="scroll-mt-28">
          <h2 className="h1 mb-6">History</h2>

          <h3 className="text-xl font-semibold mb-2">The House</h3>
          <p className="text-lg text-slate-700 mb-6">
            Built in 1860 as a countryside inn, the house was transformed into
            an artist colony in 2013. It has hosted retreats and gatherings
            since 2020, and was formalized as the Commons Hub in 2023.
          </p>

          <h3 className="text-xl font-semibold mb-2">The Village</h3>
          <p className="text-lg text-slate-700">
            Reichenau an der Rax was a 19th-century summer residence of the
            nobility — leaving behind dozens of villas, castles and pavilions.
            Hirschwang, the tiny village the Commons Hub sits in, always stayed
            industrial: wood, iron ore, a battery factory and a paper mill. Both
            villages have been in slow decay ever since — the ground we&apos;re
            now helping to bring back to life.
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
