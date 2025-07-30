require("dotenv").config();
const express = require("express");
const axios = require("axios");

const router = express.Router();

const TURN_TOKEN_ID = process.env.TURN_TOKEN_ID;
const API_TOKEN = process.env.API_TOKEN;

router.get("/get-turn-credentials", async (req, res) => {
  try {
    const response = await axios.post(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_TOKEN_ID}/credentials/generate`,
      {
        ttl: 86400, 
      },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data.iceServers);  
  } catch (error) {
    console.error("Error generating TURN credentials:", error.response?.data || error.message);
    res.status(500).send("Failed to generate TURN credentials");
  }
});

module.exports = router;  
