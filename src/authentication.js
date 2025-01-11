require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
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

// Create Express App
const app = express();

// Middleware
// Define CORS options
const corsOptions = {
  origin: ['http://localhost:5173', 'https://skii-chat.up.railway.app','https://skii-chat.vercel.app',], // Allow both local and deployed frontend
  methods: ['GET', 'POST', 'OPTIONS'], // Allowed HTTP methods
  credentials: true, // Include cookies and credentials
  allowedHeaders: ['Content-Type', 'Authorization'], // Custom headers if needed
};

// Apply middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// JSON parsing middleware
app.use(express.json());

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      domain: "https://skii-chat.vercel.app/", // Ensure this matches your frontend/backend domain

      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Adjust for local development
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? "https://skii-chat.up.railway.app/auth/google/callback"
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
app.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("https://skii-chat.vercel.app/home");
  }
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.redirect("https://skii-chat.vercel.app/");
  });
});

app.get("/user/email", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ email: req.user.email });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = app;
