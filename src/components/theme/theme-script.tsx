/**
 * Applies the stored theme BEFORE first paint.
 *
 * The theme lives in localStorage, which React cannot read during SSR, so
 * without this the page would render light and then snap to dark on hydration.
 * A blocking inline script in <head> is the standard cure — it runs before the
 * body is painted, so there is nothing to see flash.
 */
const SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || ((!stored || stored === 'system') && system);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* private mode or storage disabled: fall back to the light default */
  }
})();
`;

export function ThemeScript() {
  return (
    <script
      // Static string, no interpolation — nothing user-controlled reaches it.
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
