const http = require("http");
const express = require("express");
const authentication = require("./src/authentication");  
const turn = require("./src/turn");  
const initializeSocket = require("./src/socket");  
const cors = require("cors");
const { corsOptions } = require("./src/config/corsConfig");

const app = express();   

// Set trust proxy for production
app.set('trust proxy', 1);

// Apply CORS globally first
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authentication);   
app.use("/api", turn);  

const server = http.createServer(app);  
initializeSocket(server);   

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});