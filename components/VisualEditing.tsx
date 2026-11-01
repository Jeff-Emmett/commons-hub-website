'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Bootstraps Directus's Visual Editor click-to-edit overlay.
//
// ONLY INSIDE THE STUDIO. It initialises only when the page is rendered in an
// iframe (`window.self !== window.top`) -- the Directus Visual Editor embeds the
// live site -- so public visitors never even download the library (dynamic
// import). Elements opt in with a `data-directus` attribute (lib/directus/
// editAttr.ts, sectionEdit()/itemEdit() in lib/cms/content.ts).
//
// WHY IT RE-SCANS. apply() reads `[data-directus]` from the DOM once. This
// component lives in the root layout and mounts once per visit, while every
// menu link is a client-side navigation that swaps the page without
// remounting it -- so without a re-scan only the first page opened in the
// editor would be editable. A MutationObserver re-applies whenever editable
// elements come or go (navigation, router.refresh() after a save, late
// renders). Same approach as xhiva.art's, which hit exactly that bug.
//
// AFTER A SAVE, router.refresh() re-renders the page: the Directus flow has
// already purged the site's content cache (/api/revalidate), so the edit shows
// immediately.
export function VisualEditing() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;

    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.commons-hub.at';
    let cancelled = false;
    let observer: MutationObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let removeAll: (() => void) | undefined;

    import('@directus/visual-editing')
      .then(({ apply, remove }) => {
        if (cancelled) return;
        removeAll = remove;

        // remove() first: apply() keeps elements it already knows, so overlays
        // for nodes React has since replaced would otherwise linger.
        const rescan = () => {
          remove();
          apply({ directusUrl, onSaved: () => router.refresh() }).catch((err) =>
            console.error('visual editing failed to initialise:', err),
          );
        };

        const touchesEditable = (node: Node) =>
          node instanceof Element &&
          (node.hasAttribute('data-directus') || node.querySelector('[data-directus]') !== null);

        observer = new MutationObserver((mutations) => {
          const relevant = mutations.some(
            (m) =>
              m.type === 'attributes' ||
              Array.from(m.addedNodes).some(touchesEditable) ||
              Array.from(m.removedNodes).some(touchesEditable),
          );
          if (!relevant) return;
          // A navigation lands as a burst of mutations; scan once it settles.
          clearTimeout(timer);
          timer = setTimeout(rescan, 150);
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-directus'],
        });

        rescan();
      })
      .catch((err) => console.error('visual editing failed to initialise:', err));

    return () => {
      cancelled = true;
      observer?.disconnect();
      clearTimeout(timer);
      removeAll?.();
    };
  }, [router]);

  return null;
}
