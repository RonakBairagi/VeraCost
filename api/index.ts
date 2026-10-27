import app from '../server/index';

export default function handler(req: any, res: any) {
  // Extract target subpath from query.__path, raw url, or headers
  let targetPath = '';
  if (req.query && req.query.__path) {
    const raw = Array.isArray(req.query.__path) ? req.query.__path.join('/') : String(req.query.__path);
    targetPath = raw.replace(/^\/+/, '');
  } else if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const qPath = parsed.searchParams.get('__path');
      if (qPath) {
        targetPath = qPath.replace(/^\/+/, '');
      } else if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '/api') {
        targetPath = parsed.pathname.replace(/^\/+/, '');
      }
    } catch {}
  }

  if (targetPath) {
    req.url = targetPath.startsWith('api/') ? '/' + targetPath : '/api/' + targetPath;
  }

  return app(req, res);
}
