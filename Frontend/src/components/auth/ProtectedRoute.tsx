import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import Loading from "../ui/loading";
import { useSocketStore } from "../../stores/useSocketStore.ts";

export const ProtectedRoute = () => {
  const { user, accessToken, refreshToken, loading, getProfile } =
    useAuthStore();
  const [starting, setStarting] = useState<boolean>(true);
  const { connectSocket, disconnectSocket } = useSocketStore();

  const authInit = async () => {
    if (!accessToken) {
      await refreshToken();
    }
    if (accessToken && !user) {
      await getProfile();
    }
    setStarting(false);
  };

  const socketInit = () => {
    if (accessToken) {
      connectSocket();
    }
  };

  useEffect(() => {
    socketInit();
    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  useEffect(() => {
    authInit();
  }, []);

  if (starting || loading) {
    return <Loading />;
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet></Outlet>;
};
