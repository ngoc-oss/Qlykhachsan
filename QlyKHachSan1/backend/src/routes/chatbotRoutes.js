const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

router.post("/hoi-dap", chatbotController.hoiDap);

module.exports = router;