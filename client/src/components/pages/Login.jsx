import React, { useContext, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";

import "../../utilities.css";

const Login = () => {
  const navigate = useNavigate();
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  useEffect(() => {
    if (userId) {
      navigate("/home");
    }
  }, [userId, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
      {userId ? (
        <button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
          className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-medium text-orange-400 hover:text-orange-300 border border-orange-900/50 hover:border-orange-800 rounded transition-all duration-200"
        >
          logout
        </button>
      ) : (
        <div className="space-y-8 sm:space-y-12 -mt-20 sm:-mt-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-orange-400 mb-2 sm:mb-4">beavermath</h1>
            <p className="text-stone-400 text-base sm:text-lg">login to continue</p>
          </div>
          <div className="bg-stone-800/50 rounded-lg px-6 sm:px-10 py-6 sm:py-8 border border-stone-700">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  console.log("Google login success response:", credentialResponse);
                  handleLogin(credentialResponse);
                  navigate("/home");
                }}
                onError={(err) => {
                  console.error("Google login error:", err);
                }}
                useOneTap={false}
                theme="filled_black"
                shape="pill"
                size="large"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
