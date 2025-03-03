const router = require("express").Router();
const { getRandomQuestionsByTopic } = require('../Controller/questionController');
const { submitAnswers, ProtectedRouteForAssessment, ShowInitialQuestions, SetShowInitialQuestions, ShowWelcome, SetShowWelcome, getLearningPath, levelCompleted, ProtectedRouteForLevel, weekStreak, getUserCoins, buyStreak, submitRating, getLevelRatings} = require('../Controller/userController');
const verifyToken = require("./authentication");


// Route to get 10 random questions without correct answers
router.get('/random', verifyToken, getRandomQuestionsByTopic);

// Route to submit answers and calculate the score
router.post('/submitAnswers', verifyToken, submitAnswers);

router.post('/protectedRouteAssessment', verifyToken, ProtectedRouteForAssessment );

router.post('/protectedRouteWelcome', verifyToken, ShowWelcome );

router.post('/protectedRouteInitialQuestions', verifyToken, ShowInitialQuestions);

router.post('/setWelcome', verifyToken, SetShowWelcome );

router.post('/setInitialQuestions', verifyToken, SetShowInitialQuestions );

router.get('/learningPath', verifyToken, getLearningPath );

router.post('/levelCompleted', verifyToken, levelCompleted );

router.get('/weekStreak', verifyToken, weekStreak);

router.post('/protectedRouteGame', verifyToken, ProtectedRouteForLevel );

router.get('/coins', verifyToken, getUserCoins);

router.post('/buyStreak', verifyToken, buyStreak );

router.post('/submitRating', verifyToken, submitRating );

router.get('/levelRatings', verifyToken, getLevelRatings );


module.exports = router;
