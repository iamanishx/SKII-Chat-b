const { Server } = require("socket.io");
const { allowedOrigins } = require("./config/corsConfig");

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const socketToRoomMap = new Map();

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`Socket Connected`, socket.id);

        // SINGLE room:join handler - FIXED
        socket.on("room:join", (data) => {
            const { email, room } = data;
            
            if (!email || !room) {
                console.error("Invalid room or email");
                return;
            }
            
            console.log(`User ${email} joining room ${room}`);

            emailToSocketIdMap.set(email, socket.id);
            socketidToEmailMap.set(socket.id, email);
            socketToRoomMap.set(socket.id, room);

            socket.join(room);
            
            // Include room parameter in emission - THIS WAS MISSING
            socket.to(room).emit("user:joined", { 
                email, 
                id: socket.id, 
                room  // Add room here!
            });
            
            io.to(socket.id).emit("room:join", {
                ...data,
                socketId: socket.id,
            });
        });

        socket.on("user:call", ({ to, offer, room }) => {
            console.log(`Call initiated in room ${room} from ${socket.id} to ${to}`);
            io.to(to).emit("incoming:call", {
                from: socket.id,
                offer,
                room,
            });
        });

        socket.on("peer:ice-candidate", ({ candidate, to, room }) => {
            console.log(`📤 Forwarding ICE candidate from ${socket.id} to ${to} in room ${room}`);
            io.to(to).emit("peer:ice-candidate", {
                candidate,
                from: socket.id,
                room,
            });
        });

        socket.on("call:accepted", ({ to, answer, room }) => {
            console.log(`Call accepted in room ${room} by ${socket.id}`);
            io.to(to).emit("call:accepted", {
                from: socket.id,
                answer,
                room,
            });
        });

        socket.on("peer:nego:needed", ({ to, offer }) => {
            const room = socketToRoomMap.get(socket.id);
            console.log(`Negotiation needed in room ${room} from ${socket.id}`);
            io.to(to).emit("peer:nego:needed", {
                from: socket.id,
                offer,
                room,
            });
        });

        socket.on("peer:nego:done", ({ to, answer }) => {
            const room = socketToRoomMap.get(socket.id);
            console.log(`Negotiation completed in room ${room}`);
            io.to(to).emit("peer:nego:final", {
                from: socket.id,
                answer,
                room,
            });
        });

        socket.on("disconnect", () => {
            const email = socketidToEmailMap.get(socket.id);
            const room = socketToRoomMap.get(socket.id);

            if (email) {
                emailToSocketIdMap.delete(email);
                socketidToEmailMap.delete(socket.id);
                socketToRoomMap.delete(socket.id);

                if (room) {
                    socket.to(room).emit("user:left", { email, id: socket.id });
                }
            }
            console.log(`Socket Disconnected`, socket.id);
        });
    });

    return io;
};