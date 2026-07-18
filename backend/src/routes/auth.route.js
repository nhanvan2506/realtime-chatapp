import express from 'express';
import { signupController } from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup",signupController);

router.get("/signin",(req,res)=>{
    res.send("Hello from signin route");
});

router.get("/logout",(req,res)=>{
    res.send("Hello from logout route");
});

export default router;