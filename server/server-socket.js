const Duel = require("./models/duel");
const { maxAllowedScore } = require("../shared/problems.cjs");

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

function isParticipant(duel, userId) {
  const id = userId.toString();
  const hostId = duel.host?._id?.toString?.() || duel.host?.toString?.();
  const opponentId = duel.opponent?._id?.toString?.() || duel.opponent?.toString?.();
  return id === hostId || id === opponentId;
}

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);

      socket.on("disconnect", () => {
        const user = getUserFromSocketID(socket.id);
        removeUser(user, socket);
      });

      socket.on("join_duel", async (duelCode) => {
        try {
          const user = getUserFromSocketID(socket.id);
          if (!user) return;

          const duel = await Duel.findOne({ code: duelCode })
            .populate("host", "name")
            .populate("opponent", "name");

          if (!duel) return;
          if (!isParticipant(duel, user._id)) return;

          socket.join(duelCode);

          if (
            duel.opponent &&
            duel.opponent._id &&
            user._id &&
            duel.opponent._id.toString() === user._id.toString()
          ) {
            const hostSocket = getSocketFromUserID(duel.host._id);
            if (hostSocket) {
              hostSocket.emit("opponent_joined", {
                duel: {
                  ...duel.toObject(),
                  questions: (duel.questions || []).map(({ question }) => ({ question })),
                },
                opponentName: user.name,
              });
            }
          }
        } catch (error) {
          console.error("Error in join_duel handler:", error);
        }
      });

      socket.on("leave_duel", (duelCode) => {
        if (typeof duelCode === "string") {
          socket.leave(duelCode);
        }
      });

      socket.on("update_score", async ({ duelCode, newScore }) => {
        try {
          const user = getUserFromSocketID(socket.id);
          if (!user) return;

          const duel = await Duel.findOne({ code: duelCode });
          if (!duel || duel.status !== "in_progress") return;
          if (!isParticipant(duel, user._id)) return;

          const score = Number(newScore);
          const maxScore = Math.min(duel.questions?.length || 500, maxAllowedScore(duel.duration));
          if (!Number.isInteger(score) || score < 0 || score > maxScore) return;

          const userId = user._id.toString();
          const hostId = duel.host.toString();
          const opponentId = duel.opponent ? duel.opponent.toString() : null;

          if (userId === hostId) {
            if (score !== duel.hostScore + 1) return;
            duel.hostScore = score;
          } else if (opponentId && userId === opponentId) {
            if (score !== duel.opponentScore + 1) return;
            duel.opponentScore = score;
          } else {
            return;
          }

          await duel.save();

          io.to(duelCode).emit("score_updated", {
            hostScore: duel.hostScore,
            opponentScore: duel.opponentScore,
          });
        } catch (error) {
          console.error("Error updating score:", error);
        }
      });

      socket.on("duel_ended", async (duelCode) => {
        try {
          const user = getUserFromSocketID(socket.id);
          if (!user || typeof duelCode !== "string") return;

          const duel = await Duel.findOne({ code: duelCode });
          if (!duel) return;
          if (!isParticipant(duel, user._id)) return;
          if (duel.status === "completed") {
            io.to(duelCode).emit("duel_complete", {
              hostScore: duel.hostScore,
              opponentScore: duel.opponentScore,
              winner:
                duel.hostScore > duel.opponentScore
                  ? "host"
                  : duel.opponentScore > duel.hostScore
                    ? "opponent"
                    : "tie",
            });
            return;
          }

          duel.status = "completed";
          await duel.save();

          io.to(duelCode).emit("duel_complete", {
            hostScore: duel.hostScore,
            opponentScore: duel.opponentScore,
            winner:
              duel.hostScore > duel.opponentScore
                ? "host"
                : duel.opponentScore > duel.hostScore
                  ? "opponent"
                  : "tie",
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
