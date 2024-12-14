import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Load environment variables
configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.RSA.replace(/\\n/g, '\n'),
  }),
});

// Get Firestore Database
const db = getFirestore();

app.use(cors());
app.use(express.json());

// Fetch data from Firestore in an orderly manner
app.get("/", async (req, res) => {
  try {
    const data = (await db.collection("sensor_data")
      .orderBy("timestamp", "desc") // Order by timestamp in descending order
      .limit(50) // Limit to the latest 50 entries
      .get())
      .docs.map(doc => ({ ...doc.data() })); // Map Firestore documents to JSON objects

    console.log(`Sent data to client! @${new Date().toLocaleString(
      undefined,
      { timeZone: "Asia/Kolkata" }
    )}`);
    res.json(data.reverse()); // Reverse the order if you want the oldest first
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

// Add new data to Firestore
app.post("/", async (req, res) => {
  console.log(req.body);
  try {
    await db.collection("sensor_data").add({
      ...req.body,
      timestamp: FieldValue.serverTimestamp(), // Add server-side timestamp
    });
    res.send(`Sent data to Firestore! @${new Date().toLocaleString(
      undefined,
      { timeZone: "Asia/Kolkata" }
    )}`);
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).send("Error saving data");
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
