// Importing mongoose library along with Connection type from it
import mongoose, { Connection } from "mongoose";

// Declaring a variable to store the cached database connection
let cachedConnection: Connection | null = null;

// Set mongoose connection options
mongoose.set('bufferCommands', true); // Enable command buffering
mongoose.set('bufferTimeoutMS', 30000); // Increase buffer timeout to 30 seconds

// Function to establish a connection to MongoDB
export async function connectToDatabase() {
  // If a cached connection exists, return it
  if (cachedConnection) {
    console.log("Using cached db connection");
    return cachedConnection;
  }
  
  // Check if MongoDB URI is defined
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  
  try {
    // If no cached connection exists, establish a new connection to MongoDB
    const cnx = await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    // Cache the connection for future use
    cachedConnection = cnx.connection;
    
    // Log message indicating a new MongoDB connection is established
    console.log("New mongodb connection established");
    
    // Return the newly established connection
    return cachedConnection;
  } catch (error) {
    // If an error occurs during connection, log the error and throw it
    console.error("MongoDB connection error:", error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}
