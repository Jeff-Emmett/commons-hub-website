'use client';

import { useEffect } from 'react';

interface InstagramFeedProps {
  /**
   * Permalink to a single Instagram post to embed (e.g.
   * https://www.instagram.com/p/<shortcode>/). When omitted, only the
   * follow CTA renders. To turn this on without a code change, set
   * NEXT_PUBLIC_INSTAGRAM_PINNED_URL in the env.
   */
  pinnedUrl?: string;
  handle: string;
}

export function InstagramFeed({ pinnedUrl, handle }: InstagramFeedProps) {
  useEffect(() => {
    if (!pinnedUrl) return;
    // Instagram's official embed script renders all <blockquote.instagram-media>
    // on the page. Load once per session and re-process on mount.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // @ts-expect-error — Instagram's global lives on window when the script has loaded.
      window.instgrm?.Embeds?.process?.();
    }
  }, [pinnedUrl]);

  return (
    <section className="instagram-feed">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">@{handle} on Instagram</h2>
        <a
          href={`https://www.instagram.com/${handle}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline text-slate-700 hover:text-slate-900"
        >
          Follow →
        </a>
      </div>
      {pinnedUrl ? (
        <blockquote
          className="instagram-media mx-auto"
          data-instgrm-captioned
          data-instgrm-permalink={pinnedUrl}
          data-instgrm-version="14"
          style={{ background: '#FFF', maxWidth: 540 }}
        >
          <a href={pinnedUrl} target="_blank" rel="noopener noreferrer">
            View this post on Instagram
          </a>
        </blockquote>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-slate-700 mb-2">
            See the latest from the Hub on Instagram.
          </p>
          <a
            href={`https://www.instagram.com/${handle}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="button inline-block"
          >
            Open @{handle}
          </a>
        </div>
      )}
    </section>
  );
}
