const express = require('express');
const router = express.Router();
const { getRandomQuestions } = require('../Controller/questionController');

// Route to get 10 random questions
router.get('/random', getRandomQuestions);


module.exports = router;
