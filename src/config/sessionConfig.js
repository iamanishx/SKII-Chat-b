const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",  
    ttl: 7 * 24 * 60 * 60,  
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",  
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,  
  },
});

module.exports = sessionConfig;
