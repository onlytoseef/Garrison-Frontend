/**
 * Store-wide reset.
 *
 * Kept in its own module rather than in store.js because axiosSetup dispatches
 * it, and store.js already pulls in every slice — importing it from there would
 * close a require cycle (axiosSetup -> store -> slices -> config/api).
 * A bare action type has no such dependencies.
 */
export const RESET_STATE = "app/resetState";

export const resetState = () => ({ type: RESET_STATE });
