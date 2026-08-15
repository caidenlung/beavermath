import React, { useState, useEffect, createContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import jwt_decode from "jwt-decode";

import "../utilities.css";

import { socket } from "../client-socket";

import { get, post } from "../utilities";

export const UserContext = createContext(null);

/**
 * Define the "App" component
 */
const App = () => {
  const [userId, setUserId] = useState(undefined);
  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    get("/api/whoami")
      .then((user) => {
        if (user._id) {
          setUserId(user._id);
          setUserName(user.name.split(" ")[0]);
          setFullName(user.name);
        } else if (location.pathname !== "/") {
          navigate("/");
        }
      })
      .catch(() => {
        if (location.pathname !== "/") {
          navigate("/");
        }
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  const handleLogin = (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setUserId(user._id);
      setUserName(user.name.split(" ")[0]);
      setFullName(user.name);
      setAuthChecked(true);
      navigate("/home");
      post("/api/initsocket", { socketid: socket.id });
    });
  };

  const handleLogout = () => {
    setUserId(undefined);
    setUserName("");
    setFullName("");
    post("/api/logout");
    navigate("/");
  };

  const authContextValue = {
    userId,
    userName,
    fullName,
    authChecked,
    handleLogin,
    handleLogout,
  };

  return (
    <UserContext.Provider value={authContextValue}>
      <div className="fixed inset-0 w-full h-full bg-zinc-900">
        <Outlet />
      </div>
    </UserContext.Provider>
  );
};

export default App;
