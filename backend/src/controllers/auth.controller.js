import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import {ENV} from '../lib/env.js';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';

export const signupController = async (req, res) => {
    const {fullName, email, password} = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters long"});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Invalid email format"});
        }

        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: "Email already exists"});
        }

        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })

        if(newUser){
            // generateToken(newUser._id, res);
            // await newUser.save();
        
        const savedUser = await newUser.save();
        generateToken(savedUser._id, res);

            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
            try{
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
            } catch (error) {
                console.error("Error sending welcome email:", error);
            }
        }
        // send a welcome email to the user (this part is not implemented in this snippet)
        else{
            res.status(400).json({message: "Invalid user data"});
        }
    } catch (error) {
        console.error("Error in signupController:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginController = async (req, res) => {
    const{email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"});
    }

    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "Invalid email or password"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message: "Invalid email or password"});
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error("Error in loginController:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logoutController = async (_, res) => {
    res.cookie("jwt","",{maxAge:0});
    res.status(200).json({message:"Logged out successfully"});
}