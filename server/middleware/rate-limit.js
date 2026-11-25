// Simple in-memory rate limiter to prevent spamming orders & brute force
const ipHits = new Map();

function rateLimiter({ windowMs = 60000, max = 30, message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát!' }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipHits.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    ipHits.set(ip, record);

    if (record.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

module.exports = {
  rateLimiter
};
