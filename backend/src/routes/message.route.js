import express from 'express';
import {getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, getChatThemes, setChatTheme} from '../controllers/message.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';
import {arcjetProtection} from '../middleware/arcjet.middleware.js'
const router = express.Router();

router.use(arcjetProtection,protectedRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/themes", getChatThemes);
router.put("/theme/:id", setChatTheme);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

export default router;

