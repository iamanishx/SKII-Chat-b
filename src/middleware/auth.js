const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ 
    message: "Authentication required",
    error: "unauthorized" 
  });
};

const optionalAuth = (req, res, next) => {
  return next();
};

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
