const express = require('express');
const router = express.Router();
const { getRandomQuestions } = require('../Controller/questionController');
const { submitAnswers } = require('../Controller/userController');

// Route to get 10 random questions without correct answers
router.get('/random', getRandomQuestions);

// Route to submit answers and calculate the score
router.post('/submit-answers', submitAnswers);

module.exports = router;
