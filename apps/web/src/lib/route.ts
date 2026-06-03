export function currentRoute() {
  return window.location.hash.replace(/^#/, "") || "/";
}
export function navigate(path: string) {
  window.location.hash = path;
}
