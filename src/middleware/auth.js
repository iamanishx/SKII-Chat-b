// Authentication middleware for protecting routes
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ 
    message: "Authentication required",
    error: "unauthorized" 
  });
};

// Optional authentication middleware (user might or might not be logged in)
const optionalAuth = (req, res, next) => {
  // Always proceed, but req.user will be null if not authenticated
  return next();
};

// Admin middleware (if you want to add admin features later)
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    message: "Admin access required",
    error: "forbidden" 
  });
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
