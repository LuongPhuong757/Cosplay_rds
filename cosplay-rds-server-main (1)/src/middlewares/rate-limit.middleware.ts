import rateLimit from 'express-rate-limit';

const limit = {
  windowMs: 15 * 60 * 1000,
  max: 15000,
};

export const limiter = rateLimit(limit);
