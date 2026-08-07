import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params

        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        });

        res.status(200).json(message);
    } catch (error) {
        console.log("Error in getMessagesController");
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." });
        }

        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }

        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        //
        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const notifyConversationPartners = (message, payload, event, excludeUserId) => {
    if (message.groupId) {
        for (const memberId of message.members || []) {
            if (memberId.toString() === excludeUserId.toString()) continue;

            const receiverSocketId = getReceiverSocketId(memberId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit(event, payload);
            }
        }
    } else {
        const otherId = message.receiverId?.toString() === excludeUserId.toString()
            ? message.senderId
            : message.receiverId;

        const receiverSocketId = getReceiverSocketId(otherId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit(event, payload);
        }
    }
};

const populateMessageIfGroup = async (message) => {
    return message.groupId
        ? Message.findById(message._id).populate("senderId", "fullName profilePic")
        : Message.findById(message._id);
};

export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text is required to edit." });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }

        if (message.deletedForEveryone || (message.deletedBy || []).some((id) => id.equals(userId))) {
            return res.status(400).json({ message: "Cannot edit a deleted message." });
        }

        if (!message.senderId.equals(userId)) {
            return res.status(403).json({ message: "You can only edit your own messages." });
        }

        if (message.groupId) {
            const group = await Group.findById(message.groupId);
            if (!group || !group.members.some((m) => m.toString() === userId.toString())) {
                return res.status(403).json({ message: "You are not a member of this group." });
            }
            message.members = group.members;
        }

        message.text = text.trim();
        message.edited = true;
        await message.save();

        const updatedMessage = await populateMessageIfGroup(message);

        notifyConversationPartners(message, updatedMessage, "messageEdited", userId);

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error("Error in editMessage controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }

        if (message.deletedForEveryone) {
            return res.status(400).json({ message: "Message already deleted." });
        }

        const isSender = message.senderId.equals(userId);

        if (deleteForEveryone) {
            if (!isSender) {
                return res.status(403).json({ message: "Only the sender can delete for everyone." });
            }

            if (message.groupId) {
                const group = await Group.findById(message.groupId);
                message.members = group?.members || [];
            }

            message.text = undefined;
            message.image = undefined;
            message.deletedForEveryone = true;
            await message.save();

            const updatedMessage = await populateMessageIfGroup(message);

            notifyConversationPartners(message, updatedMessage, "messageDeleted", userId);

            return res.status(200).json(updatedMessage);
        }

        // delete for self - the sender or any recipient of the conversation
        if (message.groupId) {
            const group = await Group.findById(message.groupId);
            if (!group || !group.members.some((m) => m.toString() === userId.toString())) {
                return res.status(403).json({ message: "You are not a member of this group." });
            }
        } else {
            const isParticipant = message.senderId.equals(userId) || message.receiverId?.equals(userId);
            if (!isParticipant) {
                return res.status(403).json({ message: "You are not part of this conversation." });
            }
        }

        await Message.updateOne({ _id: message._id }, { $addToSet: { deletedBy: userId } });

        res.status(200).json({
            messageId: message._id.toString(),
            deletedBy: [...new Set([...(message.deletedBy || []).map(String), userId.toString()])],
        });
    } catch (error) {
        console.error("Error in deleteMessage controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const messages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
            receiverId: { $ne: null },
        });

        const chatPartnerIds = [...new Set(messages.map((msg) =>
            msg.senderId.toString() === loggedInUserId.toString() ? msg.receiverId.toString() : msg.senderId.toString()
        ))];

        // per-id lookups instead of $in, which can silently drop results on some MongoDB backends
        const chatPartners = (await Promise.all(
            chatPartnerIds.map((id) => User.findById(id).select("-password"))
        )).filter(Boolean);

        res.status(200).json(chatPartners)
    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const markMessagesAsRead = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToReadFrom } = req.params;

        await Message.updateMany(
            {
                senderId: userToReadFrom,
                receiverId: myId,
                readBy: { $ne: myId },
            },
            { $addToSet: { readBy: myId } }
        );

        const updated = await Message.find({
            senderId: userToReadFrom,
            receiverId: myId,
            readBy: myId,
        }).select("_id");

        const messageIds = updated.map((m) => m._id.toString());

        // let the other user know their messages have been read
        if (messageIds.length) {
            const receiverSocketId = getReceiverSocketId(userToReadFrom.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messagesRead", {
                    userId: myId.toString(),
                    messageIds,
                });
            }
        }

        res.status(200).json({ userId: myId.toString(), messageIds });
    } catch (error) {
        console.error("Error in markMessagesAsRead:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getChatThemes = async (req, res) => {
    try {
        res.status(200).json(req.user.chatThemes || {});
    } catch (error) {
        console.error("Error fetching chat themes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const setChatTheme = async (req, res) => {
    try {
        const { id: chatUserId } = req.params;
        const { themeId } = req.body;

        if (!themeId) {
            return res.status(400).json({ message: "Theme id is required" });
        }

        const currentUser = await User.findById(req.user._id);
        const chatPartner = await User.findById(chatUserId);

        if (!currentUser || !chatPartner) {
            return res.status(404).json({ message: "User not found" });
        }

        // store the theme on both users so the chat has a shared theme
        currentUser.chatThemes.set(chatUserId.toString(), themeId);
        chatPartner.chatThemes.set(req.user._id.toString(), themeId);
        await Promise.all([currentUser.save(), chatPartner.save()]);

        // notify the other user in real time so their view updates instantly
        const receiverSocketId = getReceiverSocketId(chatUserId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("themeChanged", {
                userId: req.user._id.toString(),
                themeId,
            });
        }

        res.status(200).json(currentUser.chatThemes);
    } catch (error) {
        console.error("Error setting chat theme:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};