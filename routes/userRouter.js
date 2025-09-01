import express from 'express';
import { createUser, deleteUser, getUser, loginUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/", createUser)
userRouter.get("/", getUser)
userRouter.delete("/:name", deleteUser)
userRouter.post("/login", loginUser)

export default userRouter;