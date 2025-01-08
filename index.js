const http = require("http");
const express = require("express");
const authentication = require("./src/authentication");  
const turn = require("./src/turn");  
const initializeSocket = require("./src/socket");  
const cors = require("cors");

const app = express();   

const corsOptions = {
  origin: "https://skii-chat.vercel.app",  
  methods: "GET,POST",  
  credentials: true,  
};

app.use(cors(corsOptions));
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
//http://localhost:3000/api/get-turn-credentials