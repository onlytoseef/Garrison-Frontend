/**
 * Shared motion variants for modal animations.
 *
 * Used across all modals in the app to keep the rhythm consistent: ChangePasswordModal,
 * LogsModal, BackupModal, and the Add Campus modal. One definition, not four copies.
 */

const EASE = [0.22, 1, 0.36, 1];

// Backdrop fades in and out. Keep it fast (0.2s) so the modal feels instant rather
// than sluggish. The panel's own motion is the part the eye tracks.
export const overlayFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

// The panel itself: starts slightly small and low, scales to full size as it rises.
// Both `hidden` and `exit` are defined so AnimatePresence can play the close animation,
// which is the half that is usually missing and the half whose absence feels abrupt.
export const modalPop = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18, ease: "easeIn" } },
};
