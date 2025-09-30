import express from 'express';
import { createUser, deleteUser, getUser, loginUser, getUserByEmail } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/", createUser)
userRouter.get("/", getUser)
userRouter.get("/email/:email", getUserByEmail)  // New route for getting user by email
userRouter.delete("/:name", deleteUser)
userRouter.post("/login", loginUser)

export default userRouter;