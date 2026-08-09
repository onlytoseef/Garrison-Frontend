import React from "react";
import logo from "../../assets/images/logo.webp";

/**
 * The application's loading state: the school crest with brand-blue arcs
 * turning around it.
 *
 * Two modes, because "loading" is not one thing:
 *
 *   fullscreen — nothing usable is on screen yet (a route being fetched, a page
 *                whose data has not arrived). Blurs the whole viewport.
 *   inline     — one region is loading while the rest of the page is already
 *                usable. Blurring the screen for that would be a lie about how
 *                much is unavailable, so this just fills its container.
 *
 * Not for buttons. A button that is working says so in its own label ("Saving…")
 * and must not take over the screen.
 *
 * The three arcs turn at different speeds, and the middle one turns the other
 * way. Concentric rings moving identically read as a single thick ring; the
 * differences are what make three separate pieces legible. The crest itself
 * breathes rather than spins — a rotating logo looks like a broken image, and
 * the school's mark should stay upright.
 */
const Loader = ({ fullscreen = true, size = 132, label = "Loading" }) => {
  const crest = Math.round(size * 0.48);

  const rings = (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 132 132"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <circle
          cx="66" cy="66" r="62"
          fill="none" stroke="#2F5DAA" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="96 292" opacity="0.9"
          className="ql-ring ql-ring-1"
        />
        <circle
          cx="66" cy="66" r="53"
          fill="none" stroke="#5B8EE8" strokeWidth="2" strokeLinecap="round"
          strokeDasharray="52 281" opacity="0.75"
          className="ql-ring ql-ring-2"
        />
        <circle
          cx="66" cy="66" r="45"
          fill="none" stroke="#1E3F72" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="26 257" opacity="0.5"
          className="ql-ring ql-ring-3"
        />
      </svg>

      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="object-contain ql-crest"
        style={{ width: crest, height: crest }}
        draggable="false"
      />
    </div>
  );

  // Screen readers get the state in words; sighted users get the crest.
  const announcement = (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );

  if (!fullscreen) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {rings}
        {announcement}
      </div>
    );
  }

  // Opaque white, not a translucent blur. The route loader and a page's own
  // loader can follow one another back to back — chunk arrives, component
  // mounts, its fetch starts — and a blurred overlay makes each of those a
  // visibly distinct event. A plain white screen holding the same crest reads
  // as one continuous wait instead of two.
  return (
    <div className="ql-loader fixed inset-0 z-[100] flex items-center justify-center bg-white">
      {rings}
      {announcement}
    </div>
  );
};

export default Loader;
