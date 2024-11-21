const dotenv = require("dotenv");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Question model using proper path resolution
const Question = require(path.join(__dirname, '..', 'models', 'Questions.schema'));

// Validate MongoDB connection string
if (!process.env.MONGODB_STRING) {
    console.error('MONGODB_STRING is not defined in environment variables');
    process.exit(1);
}

// Load questions from multiple JSON files
const loadQuestionsData = () => {
    const insertionStartData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'InsertionAtstart.json'), 'utf-8')
    );
    const insertionMidData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'InsertionAtmid.json'), 'utf-8')
    );
    const insertionEndData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'InsertionAtend.json'), 'utf-8')
    );
    const deletionStartData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'DeletionAtStart.json'), 'utf-8')
    );
    const deletionMidData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'DeletionAtMid.json'), 'utf-8')
    );
    const deletionEndData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'DeletionAtEnd.json'), 'utf-8')
    );
    const traversalCount = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'traversalCount.json'), 'utf-8')
    );
    const traversalMax = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'traversalMax.json'), 'utf-8')
    );
    const traversalSum = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'data', 'traversalSum.json'), 'utf-8')
    );

    // Combine all data into one array
    return [...insertionStartData, ...insertionMidData, ...insertionEndData, ...deletionStartData, ...deletionMidData, ...deletionEndData, ...traversalCount, ...traversalMax, ...traversalSum];
};

// Seed the questions
const seedQuestions = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB successfully");

        // Clear existing questions
        await Question.deleteMany({});
        console.log('Cleared existing questions');

        // Load and insert new questions from all JSON files
        const questionsData = loadQuestionsData();
        await Question.insertMany(questionsData);
        console.log('Questions inserted successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    }
};

// Run the seeding function
seedQuestions();
