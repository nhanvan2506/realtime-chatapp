import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const creatorId = req.user._id;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
            return res.status(400).json({ message: "A group needs at least 3 members (including you)" });
        }

        const uniqueMemberIds = [...new Set(memberIds.map((id) => id.toString()))];
        const finalMembers = [...new Set([creatorId.toString(), ...uniqueMemberIds])];

        if (finalMembers.length < 3) {
            return res.status(400).json({ message: "A group needs at least 3 members (including you)" });
        }

        // per-id lookups instead of $in, which can silently drop results on some MongoDB backends
        const memberChecks = await Promise.all(
            finalMembers.map((id) => User.findById(id).select("_id"))
        );
        const missing = memberChecks.map((u, i) => (u ? null : finalMembers[i])).filter(Boolean);
        if (missing.length) {
            return res.status(400).json({ message: "One or more selected members are invalid" });
        }

        const group = new Group({
            name: name.trim(),
            admin: creatorId,
            members: finalMembers,
        });
        await group.save();

        const populatedGroup = await Group.findById(group._id).populate("members", "fullName profilePic");
        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error in createGroup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate("members", "fullName profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getMyGroups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findOne({ _id: groupId, members: req.user._id });
        if (!group) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const messages = await Message.find({ groupId })
            .populate("senderId", "fullName profilePic")
            .populate({
                path: "replyTo",
                select: "text image senderId deletedForEveryone",
                populate: { path: "senderId", select: "fullName" },
            })
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markGroupMessagesAsRead = async (req, res) => {
    try {
        const { groupId } = req.params;
        const myId = req.user._id;

        const group = await Group.findOne({ _id: groupId, members: myId });
        if (!group) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        await Message.updateMany(
            {
                groupId,
                senderId: { $ne: myId },
                readBy: { $ne: myId },
            },
            { $addToSet: { readBy: myId } }
        );

        const updated = await Message.find({
            groupId,
            senderId: { $ne: myId },
            readBy: myId,
        }).select("_id");

        const messageIds = updated.map((m) => m._id.toString());

        // notify other online members so their read counts update in real time
        if (messageIds.length) {
            for (const memberId of group.members) {
                if (memberId.toString() === myId.toString()) continue;

                const receiverSocketId = getReceiverSocketId(memberId.toString());
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("groupMessagesRead", {
                        groupId: groupId.toString(),
                        userId: myId.toString(),
                        messageIds,
                    });
                }
            }
        }

        res.status(200).json({ userId: myId.toString(), messageIds });
    } catch (error) {
        console.error("Error in markGroupMessagesAsRead:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image, forwarded, replyTo } = req.body;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = group.members.some((memberId) => memberId.toString() === senderId.toString());
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            groupId,
            text,
            image: imageUrl,
            forwarded: !!forwarded,
            replyTo: replyTo || null,
        });
        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate({
                path: "replyTo",
                select: "text image senderId deletedForEveryone",
                populate: { path: "senderId", select: "fullName" },
            });

        // emit to all online group members except the sender
        for (const memberId of group.members) {
            if (memberId.toString() === senderId.toString()) continue;

            const receiverSocketId = getReceiverSocketId(memberId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newGroupMessage", populatedMessage);
            }
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
