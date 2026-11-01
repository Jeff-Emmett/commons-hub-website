'use client';

import { Fragment } from 'react';
import { SectionNav } from '@/components/SectionNav';
import { TeamSlider } from '@/components/about/TeamSlider';
import type { EditAttr } from '@/lib/directus/editAttr';

export interface TeamMember {
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
}

interface Block {
  heading: string;
  nav: string;
  editAttr?: EditAttr;
}

interface AboutGuideProps {
  team: TeamMember[];
  /** A missing section (hidden in Directus) is not rendered. */
  sections: {
    team?: Block;
    history?: Block & { items: { title: string; text: string }[] };
    contact?: Block;
  };
  siteName: string;
  address: string[];
  email: string;
}

export function AboutGuide({ team, sections, siteName, address, email }: AboutGuideProps) {
  const { team: teamS, history, contact } = sections;
  const nav = (
    [
      ['team', teamS],
      ['history', history],
      ['contact', contact],
    ] as const
  )
    .filter(([, b]) => b)
    .map(([id, b]) => ({ id, label: b!.nav || b!.heading }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
      <SectionNav sections={nav} />

      <div className="flex-1 min-w-0 space-y-20">
        {teamS && (
          <section id="team" className="scroll-mt-28" {...teamS.editAttr}>
            <h2 className="h1 mb-8">{teamS.heading}</h2>
            <TeamSlider team={team} />
          </section>
        )}

        {history && (
          <section id="history" className="scroll-mt-28" {...history.editAttr}>
            <h2 className="h1 mb-6">{history.heading}</h2>

            {history.items.map((item, i) => (
              <Fragment key={i}>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p
                  className={`text-lg text-slate-700${i < history.items.length - 1 ? ' mb-6' : ''}`}
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </Fragment>
            ))}
          </section>
        )}

        {contact && (
          <section id="contact" className="scroll-mt-28" {...contact.editAttr}>
            <h2 className="h1 mb-6">{contact.heading}</h2>
            <address className="not-italic text-lg text-slate-700 leading-relaxed">
              {siteName}<br />
              {address.map((line) => (
                <Fragment key={line}>
                  {line}<br />
                </Fragment>
              ))}
              {email && (
                <a
                  className="text-slate-900 font-medium hover:underline"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
              )}
            </address>
          </section>
        )}
      </div>
    </div>
  );
}
