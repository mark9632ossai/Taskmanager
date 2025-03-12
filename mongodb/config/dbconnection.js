import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
    try {
        // Use process.env.url or change the env variable name to MONGO_URI
        const connString = process.env.url;
        const conn = await mongoose.connect(connString);
        console.log(`Database connected on ${conn.connection.host}`);
    } catch (error) {
        console.error(`Connection to the database failed: ${error}`);
    }
};
