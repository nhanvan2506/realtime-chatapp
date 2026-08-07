import Message from "../models/Message.js";
import User from "../models/User.js";
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