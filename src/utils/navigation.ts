/**
 * A mutable reference to the React Router navigate function.
 * This allows calling navigation from outside React components (e.g., Axios interceptors).
 * The reference is set once in AppRouter on mount.
 */
let navigateFn: ((path: string) => void) | null = null;

export const setNavigate = (fn: (path: string) => void): void => {
  navigateFn = fn;
};

export const navigate = (path: string): void => {
  if (navigateFn) {
    navigateFn(path);
  } else {
    // Fallback if React Router is not yet initialised
    window.location.href = path;
  }
};
