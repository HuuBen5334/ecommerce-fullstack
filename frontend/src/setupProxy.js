const { createProxyMiddleware } = require('http-proxy-middleware');

const apiPaths = ['/products', '/users', '/orders'];

module.exports = function (app) {
  app.use(
    createProxyMiddleware(
      (pathname, req) => {
        const accept = req.headers['accept'] || '';
        return apiPaths.some(p => pathname.startsWith(p)) && !accept.includes('text/html');
      },
      { target: 'http://localhost:8080', changeOrigin: true }
    )
  );
};