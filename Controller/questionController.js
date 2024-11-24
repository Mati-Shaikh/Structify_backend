const Question = require("../models/Questions.schema");

// Utility function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Controller function to get specific random questions by topic
const getRandomQuestionsByTopic = async (req, res) => {
  try {
    // Fetch 4 questions for "InsertionAtStart"
    const insertionAtStartQuestions = await Question.aggregate([
      { $match: { topic: "Insertion At Front" } }, // Filter by topic
      { $sample: { size: 4 } }, // Sample 4 random questions
      {
        $project: {
          question: 1,
          answer: 1,
          options: 1,
          _id: 1, // Include _id field
        },
      },
    ]);

    // Fetch 3 questions for "InsertionAtMid"
    const insertionAtMidQuestions = await Question.aggregate([
      { $match: { topic: "Insertion In Middle" } }, // Filter by topic
      { $sample: { size: 3 } }, // Sample 3 random questions
      {
        $project: {
          question: 1,
          answer: 1,
          options: 1,
          _id: 1, // Include _id field
        },
      },
    ]);

    // Fetch 3 questions for "InsertionAtEnd"
    const insertionAtEndQuestions = await Question.aggregate([
      { $match: { topic: "Insertion At End" } }, // Filter by topic
      { $sample: { size: 3 } }, // Sample 3 random questions
      {
        $project: {
          question: 1,
          options: 1,
          answer: 1,
          _id: 1, // Include _id field
        },
      },
    ]);

    // Combine all questions into a single array
    let questions = [
      ...insertionAtStartQuestions,
      ...insertionAtMidQuestions,
      ...insertionAtEndQuestions,
    ];

    // Shuffle options for each question
    questions = questions.map((question) => {
      if (question.options && Array.isArray(question.options)) {
        question.options = shuffleArray(question.options);
      }
      return question;
    });

    // Check if any questions were found
    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    // Send the response with the combined questions
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching random questions by topic:", error);
    res.status(500).json({ message: "Failed to retrieve questions" });
  }
};

module.exports = {
  getRandomQuestionsByTopic,
};
