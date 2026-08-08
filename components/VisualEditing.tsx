'use client';

import { useEffect } from 'react';

// Bootstraps Directus's Visual Editor click-to-edit overlay.
//
// SAFE FOR ANONYMOUS PUBLIC VISITORS, and that claim is load-bearing because
// this mounts on every page of a production site. `apply()` always does
// `window.parent.postMessage({action:'connect'}, directusUrl)` and then polls
// for ~1s waiting for Directus Studio's iframe wrapper to reply with a
// `confirm` postMessage from that exact origin. On a normal page load there is
// no Studio parent frame listening (window.parent === window), so the poll
// times out, `apply()` returns undefined, and NO overlay elements, click
// handlers or DOM mutations are ever created. The only visitor-facing cost is a
// ~1s idle `message` listener and a few 100ms timers, both garbage-collected on
// unmount.
//
// The import is dynamic so the library stays out of the initial bundle for the
// overwhelming majority of loads, which are not editors.
//
// Same implementation as katheryn-website, deliberately: that one is proven in
// production on this estate and there is no reason for two dialects of this.
export function VisualEditing() {
  useEffect(() => {
    let cancelled = false;
    let cleanup: { remove(): void } | undefined;

    import('@directus/visual-editing').then(({ apply }) => {
      const directusUrl =
        process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.commons-hub.at';
      apply({ directusUrl }).then((handle) => {
        if (cancelled) {
          handle?.remove();
        } else {
          cleanup = handle;
        }
      });
    });

    return () => {
      cancelled = true;
      cleanup?.remove();
    };
  }, []);

  return null;
}
