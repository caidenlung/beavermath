import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const NavBar = () => {
  const { userId, fullName, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();

  if (!userId) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={() => navigate("/stats")}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 backdrop-blur rounded-lg hover:bg-zinc-700/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            G
          </div>
          <span className="text-white/90">{fullName || "Guest"}</span>
        </div>
      </button>
      <button
        onClick={handleLogout}
        className="p-2 bg-zinc-800/50 backdrop-blur rounded-lg text-white/90 hover:bg-zinc-700/50 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
      </button>
    </div>
  );
};

export default NavBar;
