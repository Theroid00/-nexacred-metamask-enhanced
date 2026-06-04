import mongoose from "mongoose";
const DEFAULT_URI = "mongodb+srv://hetshah05:Hetshahmit05@nexacred.9ndp6ei.mongodb.net/?retryWrites=true&w=majority&appName=nexacred";
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;
const connectDB = async () => {
    try {
        // Attach event listener BEFORE connecting
        mongoose.connection.on('connected', () => console.log("Database Connected"));
        await mongoose.connect(MONGODB_URI.includes('?') ? MONGODB_URI : `${MONGODB_URI}/nexacred`);
    } catch (error) {
        console.log(error.message);
    }
};

export default connectDB;