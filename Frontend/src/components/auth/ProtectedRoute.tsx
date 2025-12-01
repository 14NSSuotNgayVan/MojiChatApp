import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import Loading from "../ui/loading";

export const ProtectedRoute = () => {
  const { user, accessToken, refreshToken, loading, setLoading, getProfile } =
    useAuthStore();
  const [starting, setStarting] = useState<boolean>(true);

  const authInit = async () => {
    if (!accessToken) {
      await refreshToken();
    }
    if (accessToken && !user) {
      await getProfile();
    }
    setStarting(false);
  };

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
