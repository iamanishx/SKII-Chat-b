require("dotenv").config();
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const sessionConfig = require("./config/sessionConfig"); 
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  oauthId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", userSchema);

// Create Express Router instead of app
const router = express.Router();

router.use(express.json());
router.use(sessionConfig); 
router.use(passport.initialize());
router.use(passport.session());

// Passport Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL + "/auth/google/callback"
        : "http://localhost:3000/auth/google/callback",
    },
    
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ oauthId: profile.id });
        if (!user) {
          user = await User.create({
            oauthId: profile.id,
            name: profile.displayName,
            email: profile.emails[0]?.value,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: process.env.FRONTEND_URL + "/?error=auth_failed" 
  }),
  (req, res) => {
    // Successful authentication
    res.redirect(process.env.FRONTEND_URL + "/home");
  }
);

// Enhanced logout with proper session cleanup
router.post("/logout", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Session cleanup failed" });
      }
      
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: "Logged out successfully" });
    });
  });
});

// Enhanced user info endpoint with better error handling
router.get("/user/email", (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ 
      email: req.user.email,
      name: req.user.name,
      id: req.user._id
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Additional security: Check authentication status
router.get("/user/status", (req, res) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      email: req.user.email,
      name: req.user.name,
      id: req.user._id
    } : null
  });
});

module.exports = router;