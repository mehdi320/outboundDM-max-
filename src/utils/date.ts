// Date du jour en heure locale (YYYY-MM-DD). toISOString() donne la date UTC :
// entre minuit et 1h/2h en France, les DM seraient comptés sur la veille.
export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
