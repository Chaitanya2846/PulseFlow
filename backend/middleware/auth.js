import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "pulseflow_super_secret_key_2026";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Access denied. No valid token provided." });
    }

    // Extract the actual token (removes the "Bearer " part)
    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // This attaches { userId, role, clinicId } to the request
    
    next(); // Let the request pass through to the controller
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired session. Please log in again." });
  }
};