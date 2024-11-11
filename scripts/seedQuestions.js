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

// Load questions from JSON file with proper path resolution
const questionsData = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '..', 'data', 'Insertionquestions.json'),
        'utf-8'
    )
);

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

        // Insert new questions
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