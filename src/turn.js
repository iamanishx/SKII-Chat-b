require("dotenv").config();
const express = require("express");
const axios = require("axios");

const router = express.Router();

// Cloudflare TURN server credentials
const TURN_TOKEN_ID = process.env.TURN_TOKEN_ID;
const API_TOKEN = process.env.API_TOKEN;

// Endpoint to generate TURN credentials
router.get("/get-turn-credentials", async (req, res) => {
  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${TURN_TOKEN_ID}/turn/credentials`,
      {},
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    res.json(response.data.result);  
  } catch (error) {
    console.error("Error generating TURN credentials:", error.response?.data || error.message);
    res.status(500).send("Failed to generate TURN credentials");
  }
});

module.exports = router;  
