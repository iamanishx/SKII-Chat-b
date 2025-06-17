const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000', 
  'https://vc.mbxd.xyz',
  'http://vc.mbxd.xyz',
  'https://skiiapi.mbxd.xyz',
  'http://skiiapi.mbxd.xyz'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Origin', 
    'X-Requested-With', 
    'Accept',
    'Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

module.exports = { corsOptions, allowedOrigins };