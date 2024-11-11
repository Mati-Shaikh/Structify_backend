const Question = require('../models/Questions.schema');

// Controller function to get 10 random questions
const getRandomQuestions = async (req, res) => {
    try {
      // Fetch 10 random questions from MongoDB
      const questions = await Question.aggregate([
        { $sample: { size: 10 } },  // Sample 10 random questions
        {
          $project: {
            question: 1,   // Include the question field (change this to match your schema)
            options: 1,    // Include the options field (change this to match your schema)
            _id: 0         // Exclude the _id field from the result
          }
        }
      ]);
  
      // Check if questions were found
      if (!questions || questions.length === 0) {
        return res.status(404).json({ message: 'No questions found' });
      }
  
      // Send the response with the questions
      res.status(200).json(questions);
    } catch (error) {
      console.error('Error fetching random questions:', error);
      res.status(500).json({ message: 'Failed to retrieve questions' });
    }
  };
  
  
module.exports = {
  getRandomQuestions,
};
