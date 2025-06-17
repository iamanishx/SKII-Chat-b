const { Server } = require("socket.io");

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const socketToRoomMap = new Map(); // Add room tracking

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['https://vc.mbxd.xyz', 'http://localhost:5173'],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);

   
    socket.on("room:join", (data) => {
      const { email, room } = data;
      console.log(`User ${email} joining room ${room}`);

      // Store socket ID and email mapping
      emailToSocketIdMap.set(email, socket.id);
      socketidToEmailMap.set(socket.id, email);
      socketToRoomMap.set(socket.id, room);


      // Join the room
      socket.join(room);



      // Notify other users in the room
      socket.to(room).emit("user:joined", { email, id: socket.id });




      // Optionally acknowledge the joining user
      io.to(socket.id).emit("room:join", { ...data, socketId: socket.id });
    });

    socket.on("user:call", ({ to, offer }) => {
      const room = socketToRoomMap.get(socket.id);
      console.log(`Call initiated in room ${room} from ${socket.id} to ${to}`);
      io.to(to).emit("incoming:call", {
        from: socket.id,
        offer,
        room
      });
    });
    socket.on("call:accepted", ({ to, answer }) => {
      const room = socketToRoomMap.get(socket.id);
      console.log(`Call accepted in room ${room} by ${socket.id}`);
      io.to(to).emit("call:accepted", {
        from: socket.id,
        answer,
        room
      });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
      const room = socketToRoomMap.get(socket.id);
      console.log(`Negotiation needed in room ${room} from ${socket.id}`);
      io.to(to).emit("peer:nego:needed", {
        from: socket.id,
        offer,
        room
      });
    });
    socket.on("peer:nego:done", ({ to, answer }) => {
      const room = socketToRoomMap.get(socket.id);
      console.log(`Negotiation completed in room ${room}`);
      io.to(to).emit("peer:nego:final", {
        from: socket.id,
        answer,
        room
      });
    });
    // Handle socket disconnection
    socket.on("disconnect", () => {
      const email = socketidToEmailMap.get(socket.id);
      const room = socketToRoomMap.get(socket.id);

      if (email) {
        emailToSocketIdMap.delete(email);
        socketidToEmailMap.delete(socket.id);
        socketToRoomMap.delete(socket.id);

        // Notify others in the room about disconnection
        if (room) {
          socket.to(room).emit("user:left", { email, id: socket.id });
        }
      }
      console.log(`Socket Disconnected`, socket.id);
    });
  });

  return io;
};