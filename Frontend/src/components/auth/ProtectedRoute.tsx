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
    const authInit = async () => {
      try {
        if (!accessToken) {
          await refreshToken();
        }
        debugger
        if (accessToken && !user) {
          await getProfile();
        }
      } catch (error) {
        console.log("Lỗi khi xác thực", error)
      } finally {
        setStarting(false);
      }
    };

    authInit();
  }, []);

  if (starting || loading) {
    return (
      <div className="absolute inset-0 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet></Outlet>;
};
