const http = require("http");
const express = require("express");
const authentication = require("./src/authentication");  
const turn = require("./src/turn");  
const initializeSocket = require("./src/socket");  
const cors = require("cors");

const app = express();   

const corsOptions = {
  origin: "http://localhost:5173",  
  methods: ['GET', 'POST', 'OPTIONS'], 
  credentials: true,  
  allowedHeaders: ['Content-Type', 'Authorization'], 

};

app.use(cors(corsOptions));
app.options('*', cors()); // Handle preflight
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authentication);   

app.use("/api", turn);  

const server = http.createServer(app);  
initializeSocket(server);   

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});