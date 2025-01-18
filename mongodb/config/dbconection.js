import mongoose from "mongoose";

export const connectDB = async ()=>{
   try {
    const connString = 'mongodb+srv://michellealex1604:nZ74iMDAtwGqYe7r@cluster0.bnu40.mongodb.net/'

    const db = await mongoose.connect(connString);

    console.log(`Database connected on ${db.connection.host}`)
   } catch (error) { 
    console.log(`connection to the database failed ${error}`)
   }
}
