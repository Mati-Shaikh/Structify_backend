const Question = require('../models/Questions.schema');

// Controller function for submitting answers and calculating the score
const submitAnswers = async (req, res) => {
  try {
    const { answers } = req.body; // Answers should be an array of objects like [{ questionId: 'id', answer: 'selectedAnswer' }]
    let score = 0;

    // Iterate through the answers and check correctness
    for (let i = 0; i < answers.length; i++) {
      const { questionId, answer } = answers[i];
      
      // Find the question by its ID
      const question = await Question.findById(questionId);
      
      // Check if the question exists
      if (!question) {
        console.log(`Question with ID ${questionId} not found`);
        return res.status(404).json({ message: `Question with ID ${questionId} not found` });
      }

      // Log the correct answer and the selected answer
      console.log(`Question ID: ${questionId}, Correct Answer: ${question.answer}, Selected Answer: ${answer}`);

      // If the selected answer matches the correct answer, increment the score
      if (question.answer === answer) {
        score++;
      }
    }

    // Return the score to the user
    res.status(200).json({ score, totalQuestions: answers.length });
  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ message: 'Failed to submit answers', error: error.message });
  }
};

module.exports = {
  submitAnswers,
};
