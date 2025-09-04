import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/userRouter.js";
import serviceRouter from "./routes/serviceRouter.js";
dotenv.config()

const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

app.use(
    (req, res, next)=>{
        
    const token = (req.header("Authorization"))?.replace("Bearer ", "")

    if(token != null){
        jwt.verify(token, process.env.SECRET,(error, decoded)=>{
            if(!error){
                req.user = decoded
            }
        })
    }
    next()

    }
)

const connectionString = process.env.MONGO_DB_URL;

mongoose.connect(connectionString)
  .then(() => {
    console.log("✅ Database connected.");
  })
  .catch((err) => {
    console.log(" Database connection failed.");
    console.log("Error details:", err.message);
  });

  app.use("/api/users", userRouter)
  app.use("/api/service",serviceRouter)


app.listen(5000, () => {
  console.log(" Server is started on port 5000");
});

  //"email": "admin@example.com" - admin
  //"password": "AdminPass123"

   // "email": "alice.williams@example.com" - customer
   //"password": "CustomerPass123"

   //"email": "jane.smith@example.com", -customer
   //"password": "1234",