export function openExternalPage(url: string) {
  if (typeof window === "undefined") return;
  if (/ATableAndroid\//.test(window.navigator.userAgent)) {
    window.location.assign(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
