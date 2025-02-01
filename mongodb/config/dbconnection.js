import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const connString = 'mongodb+srv://michellealex1604:nZ74iMDAtwGqYe7r@cluster0.bnu40.mongodb.net/taskmanager?retryWrites=true&w=majority';
        const conn = await mongoose.connect(connString); // Remove deprecated options
        console.log(`Database connected on ${conn.connection.host}`);
    } catch (error) {
        console.error(`Connection to the database failed: ${error}`);
        
    }
};