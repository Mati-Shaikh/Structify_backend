const Question = require("../models/Questions.schema");

// Utility function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};


const getRandomQuestionsByTopic = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const assessmentIdNum = parseInt(assessmentId);

    // Define topics and sampling logic based on assessmentId
    let topics;
    if (assessmentIdNum === 1) {
      topics = [
        { topic: "Insertion At Front", size: 4 },
        { topic: "Insertion In Middle", size: 3 },
        { topic: "Insertion At End", size: 3 },
      ];
    } else if (assessmentIdNum === 2) {
      topics = [
        { topic: "Traversal Sum", size: 4 },
        { topic: "Traversal Count Nodes", size: 3 },
        { topic: "Traversal Maximum", size: 3 },
      ];
    } else if (assessmentIdNum === 3) {
      topics = [
        { topic: "Deletion At Front", size: 4 },
        { topic: "Deletion At End", size: 3 },
        { topic: "Deletion In Middle", size: 3 },
      ];
    } else {
      return res.status(400).json({ message: "Invalid assessmentId" });
    }

    // Fetch questions dynamically based on topics
    const fetchQuestions = async ({ topic, size }) => {
      return await Question.aggregate([
        { $match: { topic } },
        { $sample: { size } },
        {
          $project: {
            question: 1,
            answer: 1,
            options: 1,
            _id: 1, // Include _id field
          },
        },
      ]);
    };

    const questionsPromises = topics.map(fetchQuestions);
    const questionsByTopic = await Promise.all(questionsPromises);

    // Combine all questions into a single array
    let questions = questionsByTopic.flat();

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
    console.error("Error fetching random questions by assessmentId:", error);
    res.status(500).json({ message: "Failed to retrieve questions" });
  }
};



module.exports = {
  getRandomQuestionsByTopic
};
