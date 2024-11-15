const router = require("express").Router();
const verifyToken = require("./authentication");
const { getRandomQuestionsByTopic } = require("../Controller/questionController");

// Route to get 10 random questions
router.get("/random", verifyToken, getRandomQuestionsByTopic);

module.exports = router;
