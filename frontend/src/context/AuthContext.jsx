import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("userInfo");
    setUser(null);
    // Only redirect if we are not already on the login page to avoid loops
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  const checkUserStatus = useCallback(
    async (userId) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/status/${userId}`,
        );
        if (res.data.isBlocked) {
          logout();
        }
      } catch (err) {
        // 🛡️ IMPORTANT: Only logout if the user actually doesn't exist (404)
        // If the server is just slow or down (500), keep the user logged in.
        if (err.response?.status === 404) {
          logout();
        }
      }
    },
    [logout],
  );

  // AuthContext.jsx
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem("userInfo");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);

          const uid = parsed.user?._id || parsed.user?.id || parsed._id;
          if (uid) {
            // Verify status but don't let it crash the app if the server is slow
            await axios
              .get(`${import.meta.env.VITE_API_URL}/api/users/status/${uid}`)
              .then((res) => {
                if (res.data.isBlocked) logout();
              })
              .catch(() =>
                console.log("Server offline, staying logged in locally"),
              );
          }
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
      } finally {
        setLoading(false); // 👈 THIS MUST RUN TO STOP THE BLANK SCREEN
      }
    };

    initAuth();
  }, [checkUserStatus]);

  const login = (userData) => {
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
  };

  const updateWishlist = (newFavorites) => {
    setUser((prev) => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        user: { ...prev.user, favorites: newFavorites },
      };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, updateWishlist }}
    >
      {/* 🛡️ Show nothing while checking storage to prevent flashes/redirects */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
