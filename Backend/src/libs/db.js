import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);
        console.log("Successfully connected to DB!")
    } catch (error) {
        console.log("Error when connected to DB: " + error);
        process.exit(1);
    }
}