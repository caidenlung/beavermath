const Duel = require("./models/duel");
const mongoose = require("mongoose");

let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object

const getAllConnectedUsers = () => Object.values(socketToUserMap);
const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.sockets.get(socketid);

const addUser = (user, socket) => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // FIXME: is this the behavior you want?
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  userToSocketMap[user._id] = socket;
  socketToUserMap[socket.id] = user;
};

const removeUser = (user, socket) => {
  if (user) delete userToSocketMap[user._id];
  delete socketToUserMap[socket.id];
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        const user = getUserFromSocketID(socket.id);
        removeUser(user, socket);
      });
      socket.on("join_duel", async (duelCode) => {
        try {
          console.log(`Socket ${socket.id} joining duel room: ${duelCode}`);
          
          // Get the user and duel info
          const user = getUserFromSocketID(socket.id);
          if (!user) {
            console.log("No user found for socket:", socket.id);
            return;
          }

          const duel = await Duel.findOne({ code: duelCode })
            .populate("host", "name")
            .populate("opponent", "name");
          
          if (!duel) {
            console.log("No duel found with code:", duelCode);
            return;
          }

          // Join the room
          socket.join(duelCode);
          console.log(`Socket ${socket.id} (${user.name}) joined room: ${duelCode}`);

          // If this is the opponent joining, notify the host
          if (duel.opponent && duel.opponent._id && user._id && 
              duel.opponent._id.toString() === user._id.toString()) {
            console.log("Opponent joined, notifying host");
            
            // Get host's socket and notify them directly
            const hostSocket = getSocketFromUserID(duel.host._id);
            if (hostSocket) {
              hostSocket.emit("opponent_joined", {
                duel,
                opponentName: user.name,
              });
            } else {
              console.log("Warning: Could not find socket for host", duel.host._id);
            }
          }
        } catch (error) {
          console.error("Error in join_duel handler:", error);
        }
      });

      socket.on("leave_duel", (duelCode) => {
        socket.leave(duelCode);
      });

      socket.on("duel_update", (data) => {
        io.to(data.duelCode).emit("duel_state_update", data);
      });

      // Handle score updates
      socket.on("update_score", async ({ duelCode, newScore }) => {
        try {
          const user = getUserFromSocketID(socket.id);
          if (!user) return;

          const duel = await Duel.findOne({ code: duelCode });
          if (!duel) return;

          // Update the appropriate score based on whether the user is host or opponent
          if (user._id.toString() === duel.host._id.toString()) {
            duel.hostScore = newScore;
          } else if (user._id.toString() === duel.opponent._id.toString()) {
            duel.opponentScore = newScore;
          }

          await duel.save();

          // Emit updated scores to both players
          io.to(duelCode).emit("score_updated", {
            hostScore: duel.hostScore,
            opponentScore: duel.opponentScore
          });
        } catch (error) {
          console.error("Error updating score:", error);
        }
      });

      // Handle duel completion
      socket.on("duel_ended", async (duelCode) => {
        try {
          const duel = await Duel.findOne({ code: duelCode });
          if (!duel) return;

          duel.status = "completed";
          await duel.save();

          // Emit final scores and winner
          io.to(duelCode).emit("duel_complete", {
            hostScore: duel.hostScore,
            opponentScore: duel.opponentScore,
            winner: duel.hostScore > duel.opponentScore ? "host" : 
                   duel.opponentScore > duel.hostScore ? "opponent" : "tie"
          });
        } catch (error) {
          console.error("Error ending duel:", error);
        }
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getIo: () => io,
};
