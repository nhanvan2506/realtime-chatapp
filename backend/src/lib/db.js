import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const { MONGO_URI } = process.env;
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB connected',mongoose.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // 1 means failure, 0 means success
    }
};