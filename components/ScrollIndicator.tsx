"use client";

import { motion, useScroll } from "framer-motion";
import { useCarouselLive } from "@/lib/contexts/CarouselVisibilityContext";

export default function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const carouselLive = useCarouselLive();

  // Hide the left rail while a full-bleed carousel occupies the viewport.
  if (carouselLive) return null;

  return (
    <div className="scroll-indicator">
      <div
        id="w-node-b5adf061-a2f4-92e7-ad56-382778728fde-78728fdd"
        className="indicator-block"
      >
        <div className="indicator-fill">
          <motion.div
            style={{ scaleY: scrollYProgress }}
            className="indicator origin-top"
          ></motion.div>
        </div>
      </div>
      <div className="social-sidebar-icons">
        <div
          id="w-node-b5adf061-a2f4-92e7-ad56-382778728fe2-78728fdd"
          className="social-sidebar-block"
        >
          <a
            href="https://t.me/joinchat/Vcg9sAXnJ1XY5BBn"
            target="_blank"
            className="sidebar-icon w-inline-block"
            aria-label="Crypto Commons Telegram Group"
          >
            <svg
              className="social-image"
              width="42"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.6 13.07l-4.1-1.27c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
                className="social-image"
              />
            </svg>
          </a>
          <a
            href="https://x.com/CommonsHubAT"
            target="_blank"
            className="sidebar-icon w-inline-block"
            aria-label="X (formerly Twitter)"
          >
            <svg
              className="social-image"
              width="42"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                className="social-image"
              />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/commonshub/"
            target="_blank"
            className="sidebar-icon w-inline-block"
            aria-label="Instagram"
          >
            <svg
              className="social-image"
              width="42"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                className="social-image"
              />
            </svg>
          </a>
          <a
            href="http://www.youtube.com/@CommonsHub"
            target="_blank"
            className="sidebar-icon w-inline-block"
            aria-label="YouTube"
          >
            <svg
              className="social-image"
              width="42"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
                className="social-image"
              />
            </svg>
          </a>
          <a
            href="mailto:office@commons-hub.at"
            className="sidebar-icon w-inline-block"
            aria-label="Email Adress: office@commons-hub.at"
          >
            <div className="social-image w-embed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="img"
                className="iconify iconify--iconoir"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
              >
                <g className="social-image-2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 9l5 3.5L17 9"
                  ></path>
                  <path d="M2 17V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"></path>
                </g>
              </svg>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}