import express from 'express';

const router = express.Router();

router.get("/send",(req,res)=>{
    res.send("hehe");
});



export default router;

