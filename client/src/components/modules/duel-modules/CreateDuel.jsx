import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../../client-socket";

const CreateDuel = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(120); // default 2 mins
  const [lobbyCode, setLobbyCode] = useState("");
  const [isLobbyCreated, setIsLobbyCreated] = useState(false);
  const [error, setError] = useState("");
  const [duel, setDuel] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Listen for opponent joining
    socket.on("opponent_joined", ({ duel, opponentName }) => {
      console.log("Opponent joined:", opponentName);
      setDuel(duel);
      setPlayers([
        { id: duel.host._id, name: duel.host.name, isHost: true },
        { id: duel.opponent._id, name: duel.opponent.name, isHost: false },
      ]);
    });

    // Listen for duel start
    socket.on("duel_started", ({ duel, startTime, duration }) => {
      navigate("/duelplay", {
        state: {
          duel,
          startTime: new Date(startTime),
          duration,
        },
      });
    });

    return () => {
      socket.off("opponent_joined");
      socket.off("duel_started");
    };
  }, [navigate]);

  const handleCreateLobby = async () => {
    try {
      setError("");

      // Validate duration before creating lobby
      if (duration < 30 || duration > 300) {
        setError("Duration must be between 30 and 300 seconds");
        return;
      }

      const response = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create duel");
      }

      const data = await response.json();
      console.log("Created duel:", data);

      setDuel(data.duel);
      setLobbyCode(data.duel.code);
      setIsLobbyCreated(true);
      setPlayers([{ id: data.duel.host._id, name: data.duel.host.name, isHost: true }]);

      // Join socket room
      socket.emit("join_duel", data.duel.code);
    } catch (err) {
      console.error("Failed to create duel:", err);
      setError(err.message || "Failed to create duel");
    }
  };

  const handleStartGame = async () => {
    try {
      setError("");
      const response = await fetch(`/api/duel/${lobbyCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start duel");
      }
    } catch (err) {
      console.error("Failed to start duel:", err);
      setError(err.message || "Failed to start duel");
    }
  };

  const handleBackToHome = () => {
    navigate("/duel");
  };

  return (
    <div className="min-h-screen text-stone-200 flex items-center justify-center">
      <div className="max-w-xl w-full px-6 -mt-20">
        <div className="relative bg-stone-800/50 rounded-lg border border-stone-700 p-8">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-mono tracking-tight text-orange-400">create duel</h1>
              <button
                onClick={handleBackToHome}
                className="px-5 py-2.5 text-sm font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
              >
                back to home
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium">duel duration (seconds)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded text-center text-stone-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-stone-400">min: 30s, max: 300s</p>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              </div>

              {!isLobbyCreated ? (
                <button
                  onClick={handleCreateLobby}
                  className="w-full px-6 py-5 text-sm font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
                >
                  create lobby
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">lobby code</p>
                    <div className="text-2xl font-mono tracking-wider text-orange-400 py-3 px-4 bg-stone-900 border border-stone-700 rounded">
                      {lobbyCode}
                    </div>
                    <p className="text-xs text-stone-400">share this code with your opponent</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">players ({players.length}/2)</p>
                    <div className="space-y-2">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between py-2 px-4 bg-stone-900 border border-stone-700 rounded"
                        >
                          <span className="text-sm">{player.name}</span>
                          {player.isHost && <span className="text-xs text-orange-400">host</span>}
                        </div>
                      ))}
                      {players.length < 2 && (
                        <div className="py-2 px-4 bg-stone-900/50 border border-stone-800 rounded">
                          <span className="text-sm text-stone-500">waiting for opponent...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {players.length === 2 && (
                    <button
                      onClick={handleStartGame}
                      className="w-full px-6 py-5 text-sm font-medium text-orange-400 hover:text-orange-300 border border-orange-900/50 hover:border-orange-800/50 rounded transition-all duration-200"
                    >
                      start duel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDuel;
