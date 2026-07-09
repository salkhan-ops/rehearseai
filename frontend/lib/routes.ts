export function courseHref(id: string) {
  return `/course?id=${encodeURIComponent(id)}`;
}

export function reportHref(id: string, params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams({ id });
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return `/report?${search.toString()}`;
}

export function sessionHref(id: string, params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams({ id });
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return `/session?${search.toString()}`;
}
