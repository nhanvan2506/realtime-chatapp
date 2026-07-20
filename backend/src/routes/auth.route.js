import express from 'express';
import { signupController,loginController, logoutController, updateProfileController } from '../controllers/auth.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup",signupController);
router.post("/login",loginController);
router.post("/logout",logoutController);

router.put("/update-profile", protectedRoute, updateProfileController);

router.get("/check",protectedRoute,(req,res)=>res.status(200).json(req.user));

export default router;