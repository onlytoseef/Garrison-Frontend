import React from "react";
import Loader from "./Loader";

/**
 * Fallback shown while a lazily-loaded route fetches its chunk.
 *
 * The school crest, same as everywhere else a whole screen is waiting. Inline
 * rather than fullscreen: for the routes nested inside AdminLayout the sidebar
 * and header are already painted, so this fills the content area and leaves the
 * chrome in place instead of covering a page that is half there.
 *
 * min-h keeps the crest roughly where the page's own content will appear, so
 * the swap does not jump. Loader's inline mode centres itself, so no extra
 * flex wrapper is needed here.
 */
const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader fullscreen={false} />
  </div>
);

export default RouteLoader;
