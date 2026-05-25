const DEFAULT_LIMIT = 10;
const GLOBAL_DAILY_LIMIT = 1000;

function requireGenerationLimit(type = 'unknown') {
  return async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Необходима авторизация', code: 'AUTH_REQUIRED' });
    }
    next();
  };
}

module.exports = { requireGenerationLimit, DEFAULT_LIMIT, GLOBAL_DAILY_LIMIT };