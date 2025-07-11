const Question = require('../models/Questions.schema');
const UserProgress = require('../models/UserProgress.schema');
const Student = require('../models/Student.schema');
const SupportRequest = require("../models/SupportRequest.schema");  // Import the model
const mongoose = require('mongoose');
const learningPath = require('./learningPath');
const nodemailer = require("nodemailer");

const submitSupportRequest = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Support message cannot be empty" });
    }

    // Fetch user details
    const user = await Student.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store request in the database
    const supportRequest = new SupportRequest({
      user: userId,
      message
    });

    await supportRequest.save();

    // Send confirmation email to the user
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL, 
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.Email,
      subject: "Support Request Received",
      text: `Hello ${user.FirstName},\n\nWe have received your support request:\n\n"${message}"\n\nOur team is looking into it and will reach out to you soon.\n\nThank you for reaching out!\n- Structify Team`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Support request submitted successfully. We will get back to you soon.",
    });
  } catch (error) {
    console.error("Error submitting support request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendStreakBreakEmail = async (userId) => {
  // Fetch user details from the database
  const user = await Student.findById(userId);

  if (!user) {
    return;
  }

  // Set up Nodemailer to send the email
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,  // Your email address
      pass: process.env.EMAIL_PASSWORD,  // Your email password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,  // Sender address
    to: user.Email,  // Receiver's email address
    subject: "Your Learning Streak is Broken!",
    text: `Hello ${user.FirstName},\n\nIt seems like you've missed your learning streak! Don't worry, it's never too late to get back on track. Log in now and keep up the momentum to maintain your streak!\n\nKeep up the great work!\n- Structify Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Streak break email sent successfully!");
  } catch (error) {
    console.error("Error sending streak break email:", error);
  }
};

const updateStreak = async (userId) => {
  const userProgress = await UserProgress.findOne({ student: userId });
  const currentDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD

  let streakBroken = false; // New flag to track streak break

  if (!userProgress.streak.lastLoginDate) {
    // First login, initialize streak
    userProgress.streak.lastLoginDate = currentDate;
    userProgress.streak.currentStreak = 1;
    userProgress.streak.loginDates.push(new Date());
  } else {
    const lastLoginDate = new Date(userProgress.streak.lastLoginDate).toISOString().split("T")[0];

    if (new Date(lastLoginDate).getTime() + 86400000 === new Date(currentDate).getTime()) {
      // Consecutive login, increment streak
      userProgress.streak.currentStreak += 1;
    } else if (lastLoginDate !== currentDate) {
      // Non-consecutive login, reset streak
      userProgress.streak.currentStreak = 1;
      streakBroken = true; // Set streakBroken flag
    }

    if (!userProgress.streak.loginDates.some(date => date.toISOString().split("T")[0] === currentDate)) {
      userProgress.streak.loginDates.push(new Date()); // Avoid duplicate entries
    }
  }

  userProgress.streak.lastLoginDate = new Date();
  await userProgress.save();

  if (streakBroken) {
    // Send email to the user if streak is broken
    await sendStreakBreakEmail(userId);
  }
};

const getUserCoinsAndBadges = async (req, res) => {
  try {
    const userId = res.locals.userId; // The ID from the decoded token

    // Fetch user's progress to retrieve the coins balance
    const userProgress = await UserProgress.findOne({ student: userId });

    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found' });
    }

    // Count unlocked badges
    let unlockedBadgesCount = 0;
    
    // Check each topic, subtopic, and its badge lock status
    if (userProgress.learningPath && userProgress.learningPath.topics) {
      userProgress.learningPath.topics.forEach(topic => {
        if (topic.subtopics) {
          topic.subtopics.forEach(subtopic => {
            if (subtopic.badge && subtopic.badge.lock === false) {
              unlockedBadgesCount++;
            }
          });
        }
      });
    }

    // Return both the coins balance and unlocked badges count
    return res.status(200).json({
      message: 'User data retrieved successfully',
      coins: userProgress.coins,
      unlockedBadges: unlockedBadgesCount
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
    const currentStatus = userProgress.currentStatus

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


const submitAnswers = async (req, res) => {
  try {
    const { responses } = req.body;
    const assessmentId = parseInt(req.body.assessmentId, 10);
    const studentId = res.locals.userId;
    let score = 0;
    let topicStats = {}; // Tracks correct answers by topic (or level names) and their IDs
    let difficultyStats = {};
    const dangerLevels = []; // To track levels with performance < 80%

    // Fetch the user's progress to get level mappings
    const userProgress = await UserProgress.findOne({ student: studentId });
    if (!userProgress) {
      return res.status(404).json({ message: "User progress not found" });
    }

    // Create a mapping of level names to IDs for efficient lookup
    const levelNameToIdMap = {};
    userProgress.learningPath.topics.forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        subtopic.levels.forEach((level) => {
          levelNameToIdMap[level.name] = level.id;
        });
      });
    });

    // Process responses
    for (let i = 0; i < responses.length; i++) {
      const { questionId, selectedOption } = responses[i];
      const question = await Question.findById(questionId);

      if (!question) {
        console.log(`Question with ID ${questionId} not found`);
        return res.status(404).json({ message: `Question with ID ${questionId} not found` });
      }

      const topic = question.topic; // Assuming topic is the same as level name
      const levelId = levelNameToIdMap[topic]; // Fetch level ID using the map

      // Initialize stats for the topic using level ID as the key
      topicStats[levelId] = topicStats[levelId] || { name: topic, correct: 0, total: 0 };
      difficultyStats[question.difficulty] =
        difficultyStats[question.difficulty] || { correct: 0, total: 0 };

      // Increment total count for the topic
      topicStats[levelId].total++;
      difficultyStats[question.difficulty].total++;

      // If the answer is correct, increment the correct count and score
      if (question.answer === selectedOption) {
        score++;
        topicStats[levelId].correct++;
        difficultyStats[question.difficulty].correct++;
      }
    }

    console.log(topicStats);
    console.log(difficultyStats);

    const findAssessmentNameById = (assessmentId) => {
      for (const topic of userProgress.learningPath.topics) {
        for (const subtopic of topic.subtopics) {
          if (subtopic.assessment && subtopic.assessment.id === assessmentId) {
            return subtopic.assessment.name; // Return the name of the assessment
          }
        }
      }
      return null;
    };

    // We'll accumulate unlocked badge(s) here (if any)
    let unlockedBadges = [];

    if (score < 8) {
      // Declare the Assessment in danger
      for (const topic of userProgress.learningPath.topics) {
        for (const subtopic of topic.subtopics) {
          if (subtopic.assessment && subtopic.assessment.id === assessmentId) {
            subtopic.assessment.danger = true;
            subtopic.assessment.isCompleted = false;
          }
        }
      }

      // Identify danger levels (topics/levels with < 80% performance)
      for (const level in topicStats) {
        const { correct, total, name } = topicStats[level];
        if ((correct / total) * 100 < 60) {
          dangerLevels.push({ id: parseInt(level), name: name });
        }
      }

      // Mark levels as danger in the user's learning path
      userProgress.learningPath.topics.forEach((topic) => {
        topic.subtopics.forEach((subtopic) => {
          subtopic.levels.forEach((level) => {
            if (dangerLevels.some((danger) => danger.id === level.id)) {
              level.danger = true;
              level.isCompleted = false;
            }
          });
        });
      });

      // Update assessment details for failure
      userProgress.assessments.push({
        id: assessmentId,
        name: findAssessmentNameById(assessmentId),
        date: new Date(),
        score,
        passed: false,
        dangerLevels,
      });

      await userProgress.save();

    } else {
      // Score is 8 or greater: update assessment and unlock badge
      for (let i = 0; i < userProgress.learningPath.topics.length; i++) {
        const topic = userProgress.learningPath.topics[i];

        for (let j = 0; j < topic.subtopics.length; j++) {
          const subtopic = topic.subtopics[j];

          if (subtopic.assessment && subtopic.assessment.id === assessmentId) {
            // Mark current assessment as completed and update its levels
            subtopic.assessment.isCompleted = true;
            subtopic.assessment.danger = false;
            // Unlock the badge for this subtopic
            subtopic.badge.lock = false;
            unlockedBadges.push(subtopic.badge);

            subtopic.levels.forEach((level) => {
              if (!level.isLocked) {
                level.danger = false;
                level.isCompleted = true;
              }
            });

            // Unlock the first level of the next subtopic if exists
            if (j + 1 < topic.subtopics.length) {
              const nextSubtopic = topic.subtopics[j + 1];
              if (nextSubtopic.levels.length > 0) {
                const firstLevel = nextSubtopic.levels[0];
                firstLevel.isLocked = false;
                userProgress.currentStatus = {
                  level: {
                    id: firstLevel.id,
                    name: firstLevel.name
                  },
                  topic: topic.topic,
                  subtopic: nextSubtopic.subtopic
                };
              }
            }
          }
        }
      }

      // Update assessment details for success
      userProgress.assessments.push({
        id: assessmentId,
        name: findAssessmentNameById(assessmentId),
        date: new Date(),
        score,
        passed: true,
        dangerLevels: [],
      });

      await userProgress.save();
    }

    // Prepare response with stats for frontend visualization.
    // Include the unlocked badge data only if it was unlocked.
    const result = {
      score,
      totalQuestions: responses.length,
      topicStats,
      difficultyStats,
      dangerLevels,
      ...(unlockedBadges.length > 0 && { unlockedBadges })
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error submitting answers:", error);
    res.status(500).json({ message: "Failed to submit answers", error: error.message });
  }
};

const levelCompleted = async (req, res) => {
  try {
    const userId = res.locals.userId; // The ID from the decoded token

    // Update streak
    if(userId) {
      await updateStreak(userId);
    }

    const { nextLevel, currentLevel } = req.body;

    // Extract level IDs from the provided names (assuming level names follow the "level1", "level2" pattern)
    const currentLevelId = parseInt(currentLevel.replace('level', ''), 10);
    const nextLevelId = parseInt(nextLevel.replace('level', ''), 10);

    // Fetch user's learning progress
    const userProgress = await UserProgress.findOne({ student: userId });
    if (!userProgress) {
      return res.status(404).json({ message: "User progress not found" });
    }

    let levelUpdated = false;
    let assessmentUpdated = false;
    let flag = true;
    let currentLevelName = "";

    // Process the levels and assessments based on divisibility by 3
    userProgress.learningPath.topics.forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        subtopic.levels.forEach((level) => {
          if (level.id === currentLevelId) {

            if(level.isCompleted) { // If already completed level then a flag for not changing currentStatus
              flag = false;
            }

            // 1. Mark the current level as completed
            level.isCompleted = true;
            level.danger = false;
            levelUpdated = true;

            userProgress.coins += 30;

            // If the current level is not divisible by 3, unlock the next level
            const nextLevelInSubtopic = subtopic.levels.find(l => l.id === nextLevelId);
            if (currentLevelId % 3 !== 0) {
              if (nextLevelInSubtopic) {
                nextLevelInSubtopic.isLocked = false;
              }
            }

            if (nextLevelInSubtopic && flag) {
              userProgress.currentStatus = {
                level: {
                  id: nextLevelId,
                  name: nextLevelInSubtopic.name
                },
                topic: topic.topic,
                subtopic: subtopic.subtopic
              };
            }

            // Fetch the correct name for the current level
            currentLevelName = level.name;
          }

          if (currentLevelId % 3 === 0 && level.id === currentLevelId) {
            // If the level is not divisible by 3, find the assessment after the current level
            if (subtopic.assessment && subtopic.assessment.id) {
              subtopic.assessment.isLocked = false;
              assessmentUpdated = true;
            }
          }
        });
      });
    });

    // Save the changes to user progress
    if (levelUpdated || assessmentUpdated) {
      await userProgress.save();

      // Send the response with the current level's id and name
      return res.status(200).json({
        message: "Level completed and progress updated successfully.",
        currentLevel: {
          id: currentLevelId,
          name: currentLevelName // Send the fetched level name
        }
      });
    } else {
      res.status(400).json({ message: "Unable to update level or assessment." });
    }
  } catch (error) {
    console.error('Error completing level:', error);
    res.status(500).json({ message: 'Failed to complete level', error: error.message });
  }
};


const ProtectedRouteForLevel = async (req, res) => {
  try {
    const { userId, level } = req.body;

    const decodedUserId = res.locals.userId; // The ID from the decoded token

    // Validate that the userId in the request body matches the decoded userId
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

    // Retrieve user progress
    const userProgress = await UserProgress.findOne({
      student: validUserId
    });

    if (!userProgress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Convert levelId (string) to a number
    const numericLevelId = parseInt(level.replace('level', ''), 10);
    if (isNaN(numericLevelId)) {
      return res.status(400).json({ message: 'Invalid level ID format' });
    }

    // Find the level in the learning path
    const learningPath = userProgress.learningPath || { topics: [] };

    let levelFound = false;
    let levelUnlocked = false;

    // Loop through topics, subtopics, and levels to find the requested level
    for (const topic of learningPath.topics) {
      for (const subtopic of topic.subtopics) {
        const level = subtopic.levels.find(l => l.id === numericLevelId);
        if (level) {
          levelFound = true;
          levelUnlocked = !level.isLocked; // Check if the level is unlocked
          break;
        }
      }
      if (levelFound) break;
    }

    if (!levelFound || !levelUnlocked) {
      return res.status(404).json({ message: 'Level not found in the learning path' });
    }

    // Return the status of the level (unlocked or locked)
    return res.status(200).json({
      message: 'Level is unlocked',
    });

  } catch (error) {
    console.error('Error in ProtectedRouteForLevel:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

const weekStreak = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const userProgress = await UserProgress.findOne({ student: userId });
    if (!userProgress) return res.status(404).json({ message: "Progress not found" });

    // Convert loginDates to YYYY-MM-DD format for the calendar
    const loginDates = userProgress.streak.loginDates.map(date =>
      new Date(date).toISOString().split("T")[0]
    );

    res.status(200).json({ loginDates });
  } catch (error) {
    console.error('Error fetching calendar streak:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const buyStreak = async (req, res) => {
  try {
    const userId = res.locals.userId; // Get user ID from token
    const { missedDate } = req.body; // Missed date to be bought (yyyy-mm-dd format)

    // Fetch the user's progress
    const userProgress = await UserProgress.findOne({ student: userId });

    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found' });
    }

    // Check if the user has sufficient coins (100 coins required)
    if (userProgress.coins < 100) {
      return res.status(400).json({ message: 'Insufficient coins to buy streak' });
    }

    // Check if the missed date is in the streak loginDates
    const streakLoginDates = userProgress.streak.loginDates;
    if (streakLoginDates.includes(missedDate)) {
      return res.status(400).json({ message: 'Streak already completed for this day' });
    }

    // Add the missed day to the streak
    userProgress.streak.loginDates.push(missedDate);
    userProgress.coins -= 100; // Deduct coins

    await userProgress.save();

    return res.status(200).json({
      message: 'Streak purchased successfully',
      updatedStreak: userProgress.streak.loginDates,
      updatedCoins: userProgress.coins
    });
  } catch (error) {
    console.error('Error buying streak:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitRating = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { levelId, rating } = req.body;

    if (!levelId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating data" });
    }

    const userProgress = await UserProgress.findOne({ student: userId });

    if (!userProgress) {
      return res.status(404).json({ message: "User progress not found" });
    }

    let levelFound = null;
    let levelPath = null;

    // Find the level and store its path
    userProgress.learningPath.topics.forEach((topic, topicIndex) => {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        subtopic.levels.forEach((level, levelIndex) => {
          if (level.id === levelId) {
            levelFound = level;
            levelPath = {
              topicIndex,
              subtopicIndex,
              levelIndex
            };
          }
        });
      });
    });

    if (!levelFound) {
      return res.status(404).json({ message: "Level not found" });
    } else {
      // Update the rating directly instead of trying to push to an array
      const topic = userProgress.learningPath.topics[levelPath.topicIndex];
      const subtopic = topic.subtopics[levelPath.subtopicIndex];
      
      // Set the rating directly
      subtopic.levels[levelPath.levelIndex].rating = rating;
    }

    await userProgress.save();

    res.status(200).json({
      message: "Rating submitted successfully",
      rating: rating
    });

  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLevelRatings = async (req, res) => {
  try {
    // Find all user progress documents
    const allUserProgress = await UserProgress.find({}, 'learningPath');
    
    if (!allUserProgress || allUserProgress.length === 0) {
      return res.status(404).json({ message: 'No user progress data found' });
    }
    
    // Initialize a map to store level ratings
    const levelRatings = {};
    
    // Iterate through all user progress data
    allUserProgress.forEach(userProgress => {
      // Iterate through topics, subtopics, and levels to collect all ratings
      userProgress.learningPath.topics.forEach(topic => {
        topic.subtopics.forEach(subtopic => {
          subtopic.levels.forEach(level => {
            // Only process levels that have ratings
            if (level.rating && level.rating > 0) {
              // Initialize level data if not already present
              if (!levelRatings[level.id]) {
                levelRatings[level.id] = {
                  totalRating: 0,
                  ratingCount: 0,
                  averageRating: 0
                };
              }
              
              // Add this rating to the total
              levelRatings[level.id].totalRating += level.rating;
              levelRatings[level.id].ratingCount += 1;
            }
          });
        });
      });
    });
    
    // Calculate average ratings
    Object.keys(levelRatings).forEach(levelId => {
      const level = levelRatings[levelId];
      level.averageRating = (level.totalRating / level.ratingCount).toFixed(1);
    });
    
    return res.status(200).json({
      message: 'Level ratings retrieved successfully',
      levelRatings
    });
  } catch (error) {
    console.error('Error retrieving level ratings:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  submitAnswers,
  ProtectedRouteForAssessment,
  ShowInitialQuestions,
  SetShowInitialQuestions,
  ShowWelcome,
  SetShowWelcome,
  getLearningPath,
  levelCompleted, 
  ProtectedRouteForLevel,
  weekStreak,
  getUserCoinsAndBadges,
  buyStreak,
  submitRating,
  getLevelRatings,
  submitSupportRequest
};