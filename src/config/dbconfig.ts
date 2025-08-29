import mongoose from "mongoose";


export const connectDB = async (): Promise<void>  => {
  try {
    const uri= process.env.MONGO_URI || ''
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

