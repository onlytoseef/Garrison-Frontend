import React from "react";

/**
 * Fallback shown while a lazily-loaded route fetches its chunk.
 *
 * Deliberately quiet: on a fast connection the chunk arrives in well under a
 * second, and a spinner that flashes for 200ms reads as jank rather than
 * progress. This is a calm skeleton in the brand blue, sized to fill the page
 * area so the layout does not jump when the real page swaps in.
 */
const RouteLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
      <div
        className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
        style={{ borderTopColor: "#2F5DAA" }}
      />
    </div>
    <p className="text-sm text-gray-400">Loading…</p>
  </div>
);

export default RouteLoader;
