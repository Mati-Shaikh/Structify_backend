const Question = require('../models/Questions.schema');
const UserProgress = require('../models/UserProgress.schema'); 
const Student = require('../models/Student.schema');
const mongoose = require('mongoose');
const learningPath = require('./learningPath');

const ProtectedRouteForAssessment = async (req, res) => {
  try {
    // Validate userId using the existing protected route logic
    const { userId, assessmentId } = req.body;

    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }


    // Validate and convert userId to ObjectId
    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid user ID format',
        error: error.message 
      });
    }

    // Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({ 
      student: validUserId 
    });

   

    if (!userProgress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const numericAssessmentId = parseInt(assessmentId, 10);
    if (isNaN(numericAssessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID format' });
    }

    // Find the assessment in the learning path
    const learningPath = userProgress.learningPath || { topics: [] };

    let assessmentFound = null;
    for (const topic of learningPath.topics) {
      for (const subtopic of topic.subtopics) {
        if (subtopic.assessment?.id === numericAssessmentId) {
          assessmentFound = subtopic.assessment;
          break;
        }
      }
      if (assessmentFound) break;
    }

    if (!assessmentFound) {
      return res.status(404).json({ message: 'Assessment not found in the learning path' });
    }

    // Check if the assessment is locked
    if (assessmentFound.isLocked) {
      return res.status(403).json({
        message: 'Access denied: Assessment is locked',
        assessment: {
          id: assessmentFound.id,
          name: assessmentFound.name,
        },
      });
    }

    // Grant access
    return res.status(200).json({
      message: 'Access granted',
    });

  } catch (error) {
    console.error('Error in ProtectedRouteForAssessment:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const ShowWelcome = async (req, res) => {
  try {
    // Validate userId using the existing protected route logic
    const { userId } = req.body;
    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }

    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid user ID format',
        error: error.message 
      });
    }

    // Step 3: Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({ 
      student: validUserId 
    });

    if (!userProgress) {
      return res.status(200).json({ message: 'Progress not found' });
    }

    // Check the showWelcome field
    if (userProgress.showWelcome) {
      return res.status(200).json({ message: 'ShowWelcome is true' });
    }

    return res.status(400).json({ message: 'ShowWelcome is false' });
  } catch (error) {
    console.error('Error in ShowWelcome:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const SetShowWelcome = async (req, res) => {
  try {
    // Step 1: Validate userId using the existing protected route logic
    const { userId } = req.body;
    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }

    // Step 2: Validate and convert userId to ObjectId
    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: error.message
      });
    }

    // Step 3: Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({
      student: validUserId
    });

    if (!userProgress) {
      // If no progress found, check if the user exists
      const userExists = await Student.findById(validUserId);
      
      if (userExists) {
        // Create a new progress record if user exists but no progress found
        const newUserProgress = new UserProgress({
          student: validUserId,
          learningPath,
          assessments: [],
          showWelcome: false
        });
        await newUserProgress.save();
        return res.status(200).json({ message: 'ShowWelcome set to false' });
      } else {
        return res.status(400).json({ message: 'User not found' });
      }
    }

    // Step 4: Set the showWelcome field to false
    userProgress.showWelcome = false;
    await userProgress.save();

    return res.status(200).json({ message: 'ShowWelcome set to false' });

  } catch (error) {
    console.error('Error in SetShowWelcome:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


const ShowInitialQuestions = async (req, res) => {
  try {
    // Step 1: Validate userId using the existing protected route logic
    const { userId } = req.body;
    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }

    // Step 2: Validate and convert userId to ObjectId
    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: error.message
      });
    }

    // Step 3: Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({
      student: validUserId
    });

    if (!userProgress) {
      return res.status(200).json({ message: 'User Progress not found' });
    }

    // Step 4: Check the showInitialQuestions field
    if (userProgress.showInitialQuestions) {
      return res.status(200).json({ message: 'ShowInitialQuestions is true' });
    }

    return res.status(400).json({ message: 'ShowInitialQuestions is false' });
  } catch (error) {
    console.error('Error in ShowInitialQuestions:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

const SetShowInitialQuestions = async (req, res) => {
  try {
    // Step 1: Validate userId using the existing protected route logic
    const { userId } = req.body;
    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }

    // Step 2: Validate and convert userId to ObjectId
    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: error.message
      });
    }

    // Step 3: Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({
      student: validUserId
    });

    if (!userProgress) {
      // If no progress found, check if the user exists
      const userExists = await Student.findById(validUserId);
      
      if (userExists) {
        // Create a new progress record if user exists but no progress found
        const newUserProgress = new UserProgress({
          student: validUserId,
          learningPath,
          assessments: [],
          showInitialQuestions: false
        });
        await newUserProgress.save();
        return res.status(200).json({ message: 'ShowInitialQuestions set to false' });
      } else {
        return res.status(400).json({ message: 'User not found' });
      }
    }

    // Step 4: Set the showInitialQuestions field to false
    userProgress.showInitialQuestions = false;
    await userProgress.save();

    return res.status(200).json({ message: 'ShowInitialQuestions set to false' });

  } catch (error) {
    console.error('Error in SetShowInitialQuestions:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


const getLearningPath = async (req, res) => {
  try {
    
    const userId = res.locals.userId; // The ID from the decoded token

    // Validate and convert userId to ObjectId
    let validUserId;
    try {
      validUserId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: error.message,
      });
    }

    // Step 2: Retrieve the user's learning path
    const userProgress = await UserProgress.findOne({
      student: validUserId,
    });

    if (!userProgress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const learningPath = userProgress.learningPath;
    const currentStatus= userProgress.currentStatus

    // Step 3: Respond with the learning path
    return res.status(200).json({
      message: 'Learning path retrieved successfully',
      learningPath,
      currentStatus
    });
  } catch (error) {
    console.error('Error in getLearningPath:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};



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
  ProtectedRouteForAssessment,
  ShowInitialQuestions,
  SetShowInitialQuestions,
  ShowWelcome,
  SetShowWelcome,
  getLearningPath
};
