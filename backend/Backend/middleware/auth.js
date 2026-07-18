import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error("CRITICAL: JWT_SECRET environment variable is not set in production. Hard-failing startup.");
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set in production. Hard-failing startup.");
}

const EFFECTIVE_SECRET = JWT_SECRET || 'dev_jwt_secret_key';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, EFFECTIVE_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired", expired: true });
      }
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}