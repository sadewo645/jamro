function compilePath(path) {
  const segments = path.split('/').filter(Boolean);
  const keys = [];
  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const regex = new RegExp(`^/${pattern}${path.endsWith('/') ? '' : '$'}`);
  return { regex, keys };
}

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler, options = {}) {
    const { regex, keys } = compilePath(path);
    this.routes.push({ method: method.toUpperCase(), path, regex, keys, handler, options });
  }

  match(method, pathname) {
    const upper = method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== upper) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        return { ...route, params };
      }
    }
    return null;
  }
}
