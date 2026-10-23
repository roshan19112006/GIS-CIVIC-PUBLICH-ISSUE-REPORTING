import React, { createContext, useContext, useState, useEffect } from 'react';
import issueService from '../services/issueService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civic_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civic_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoRole = params.get('demo');

    const initAuth = async () => {
      if (demoRole) {
        let email = 'citizen@gmail.com';
        if (demoRole === 'admin') email = 'admin@civic.gov';
        if (demoRole === 'officer') email = 'officer.roads@civic.gov';
        await login(email, 'Password@123');
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const res = await issueService.getMe();
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('civic_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await issueService.login({ email, password });
      if (res.data?.success && res.data?.token) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('civic_token', newToken);
        localStorage.setItem('civic_user', JSON.stringify(newUser));
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials or server unavailable';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await issueService.register(userData);
      if (res.data?.success && res.data?.token) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('civic_token', newToken);
        localStorage.setItem('civic_user', JSON.stringify(newUser));
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
      const validationMsgs = err.response?.data?.errors?.map((e) => e.message).join(' | ');
      const message =
        validationMsgs ||
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Unable to connect to the backend server. Please verify the server is running.'
          : err.message) ||
        'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isRole: (roles) => {
          if (!user) return false;
          const allowed = Array.isArray(roles) ? roles : [roles];
          return allowed.includes(user.role);
        },
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
