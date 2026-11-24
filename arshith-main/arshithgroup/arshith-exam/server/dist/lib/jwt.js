import jwt from 'jsonwebtoken';
import { config } from '../config.js';
export const signToken = (p) => jwt.sign(p, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
export const verifyToken = (t) => jwt.verify(t, config.JWT_SECRET);
