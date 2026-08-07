import express from 'express';
import {getAllContacts, getMessagesByUserId, sendMessage, getChatPartners, getChatThemes, setChatTheme, markMessagesAsRead} from '../controllers/message.controller.js';
import {createGroup, getMyGroups, getGroupMessages, sendGroupMessage, markGroupMessagesAsRead} from '../controllers/group.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';
import {arcjetProtection} from '../middleware/arcjet.middleware.js'
const router = express.Router();

router.use(arcjetProtection,protectedRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/themes", getChatThemes);
router.put("/theme/:id", setChatTheme);
router.get("/read/:id", markMessagesAsRead);

router.post("/groups", createGroup);
router.get("/groups", getMyGroups);
router.get("/groups/:groupId/read", markGroupMessagesAsRead);
router.get("/groups/:groupId", getGroupMessages);
router.post("/groups/:groupId/send", sendGroupMessage);

router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

export default router;

