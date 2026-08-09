/**
 * Kept as a named entry point for route-level Suspense fallbacks.
 *
 * Routes are the one place a full-screen loader is unambiguously right: until
 * the chunk arrives there is no page to show at all. Everything else should
 * import Loader directly and choose its own mode.
 */
import React from "react";
import Loader from "./Loader";

const RouteLoader = () => <Loader fullscreen />;

export default RouteLoader;
