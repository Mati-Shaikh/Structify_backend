const router = require("express").Router();
const { getRandomQuestionsByTopic } = require('../Controller/questionController');
const { submitAnswers, ProtectedRouteForAssessment, ShowInitialQuestions, SetShowInitialQuestions, ShowWelcome, SetShowWelcome } = require('../Controller/userController');
const verifyToken = require("./authentication");

// Route to get 10 random questions without correct answers
router.get('/random', getRandomQuestionsByTopic);

// Route to submit answers and calculate the score
router.post('/submit-answers', submitAnswers);

router.post('/protectedRouteAssessment', verifyToken, ProtectedRouteForAssessment );

router.post('/protectedRouteWelcome', verifyToken, ShowWelcome );

router.post('/protectedRouteInitialQuestions', verifyToken, ShowInitialQuestions);

router.post('/setWelcome', verifyToken, SetShowWelcome );

router.post('/setInitialQuestions', verifyToken, SetShowInitialQuestions );

module.exports = router;
