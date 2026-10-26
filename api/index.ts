import app from '../server/index';

export default function handler(req: any, res: any) {
  // When Vercel rewrites /api/(.*) to /api?__path=$1, restore the subpath
  if (req.query && req.query.__path) {
    const raw = Array.isArray(req.query.__path) ? req.query.__path.join('/') : String(req.query.__path);
    const cleanSubpath = raw.replace(/^\/+/, '');
    req.url = cleanSubpath.startsWith('api/') ? '/' + cleanSubpath : '/api/' + cleanSubpath;
  } else {
    const matchedPath = req.headers['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string' && (req.url === '/api' || req.url === '/' || !req.url.includes('/chat'))) {
      req.url = matchedPath;
    } else if (req.headers['x-forwarded-url'] && typeof req.headers['x-forwarded-url'] === 'string') {
      try {
        const parsed = new URL(req.headers['x-forwarded-url'], 'http://localhost');
        if (parsed.pathname && parsed.pathname.length > 1) {
          req.url = parsed.pathname + parsed.search;
        }
      } catch {}
    }
  }
  return app(req, res);
}
