const Question = require('../models/Questions.schema');

// Controller function to get 10 random questions
const getRandomQuestions = async (req, res) => {
  try {
    // Fetch 10 random questions from MongoDB
    const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({ message: 'Failed to retrieve questions' });
  }
};

module.exports = {
  getRandomQuestions,
};
