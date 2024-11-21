const Question = require('../models/Questions.schema');
const UserProgress = require('../models/UserProgress.schema'); 
const Student = require('../models/Student.schema');
const mongoose = require('mongoose');

const ProtectedRouteForAssessment = async (req, res) => {
  try {
    // Step 1: Validate userId using the existing protected route logic
    const { userId, assessmentName } = req.body;
    const decodedUserId = res.locals.userId; // The ID from the decoded token

    if (decodedUserId !== userId) {
      return res.status(401).json({ message: 'Access denied: Invalid user ID' });
    }

    // Step 2: Check if the assessment name is correct
    if (assessmentName !== 'LinkedListInsertion') {
      return res.status(400).json({ message: 'Invalid assessment name' });
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

    // Step 3: Retrieve user progress with more flexible querying
    const userProgress = await UserProgress.findOne({ 
      student: validUserId 
    });

   

    if (!userProgress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Required levels for the assessment
    const requiredLevels = [
      { levelNumber: 1, levelName: 'InsertionAtFront' },
      { levelNumber: 2, levelName: 'InsertionAtEnd' },
      { levelNumber: 3, levelName: 'InsertionInMiddle' }
    ];

    // Check if all required levels are completed
    const completedLevels = userProgress.levelsCompleted || [];
    const isAccessAllowed = requiredLevels.every(level =>
      completedLevels.some(
        completed => 
          completed.levelNumber === level.levelNumber && 
          completed.levelName === level.levelName
      )
    );

    if (!isAccessAllowed) {
      // Identify missing levels
      const missingLevels = requiredLevels.filter(level =>
        !completedLevels.some(
          completed => 
            completed.levelNumber === level.levelNumber && 
            completed.levelName === level.levelName
        )
      );

      return res.status(403).json({
        message: 'Access denied: Required levels are not completed',
        missingLevels: missingLevels,
        completedLevels: completedLevels
      });
    }

    // Step 4: Grant access
    return res.status(200).json({
      message: 'Access granted',
      userId: decodedUserId,
      assessmentName,
      completedLevels: completedLevels
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
          levelsCompleted: [],
          levelsUnlocked: [],
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
          levelsCompleted: [],
          levelsUnlocked: [],
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
  SetShowWelcome
};
