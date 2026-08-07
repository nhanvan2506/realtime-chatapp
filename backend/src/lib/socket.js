import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: [ENV.CLIENT_URL],
        credentials: true
    },
});

//apply auth middleware to all socket connections
io.use(socketAuthMiddleware);

//use this function to check if the user is online or not
const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
    console.log("A User connected", socket.user.fullName)

    const userId = socket.userId;
    userSocketMap[userId] = socket.id

    //io.emit used to send events to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    // join/leave a socket room per group so typing can be broadcast to members viewing it
    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
    });

    socket.on("leaveGroup", (groupId) => {
        socket.leave(groupId);
    });

    // relay typing indicators to the intended recipient
    socket.on("typing", (data) => {
        const { receiverId, groupId, isTyping } = data || {};

        if (receiverId) {
            const targetSocketId = getReceiverSocketId(receiverId);
            if (targetSocketId) {
                io.to(targetSocketId).emit("typing", {
                    userId,
                    receiverId,
                    isTyping: !!isTyping,
                });
            }
        } else if (groupId) {
            socket.to(groupId).emit("typing", {
                userId,
                groupId,
                isTyping: !!isTyping,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("A User disconnected", socket.user.fullName);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export {io, app, server};