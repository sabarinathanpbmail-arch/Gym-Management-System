import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
 
export const isSameGym = (gymA, gymB) => {
  if (!gymA || !gymB) return false;
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean(gymA) !== '' && clean(gymA) === clean(gymB);
};

export const getGymDisplayName = (targetObj, currentAuthUser) => {
  const isOwner = (u) => /^owner$/i.test(u?.role || u?.user_role || '');
  const getCleanFirst = (u) => (u?.user_first_name || (u?.name ? u.name.split(' ')[0] : '')).trim();

  // 1. Check targetObj
  if (targetObj) {
    const gn = targetObj.gymName || targetObj.gym_name;
    const first = getCleanFirst(targetObj);
    const selfNamed = !isOwner(targetObj) && first && gn && gn.toLowerCase() === `${first.toLowerCase()} fitness`;
    if (gn && gn !== 'Aurum Fitness Club' && gn !== 'Fitness Club' && gn !== 'Fitness Center' && !selfNamed) {
      return gn;
    }
    const ec = String(targetObj.emergencyContact || targetObj.emergency_contact || '').trim();
    if (ec && ec !== 'None' && ec !== 'None Listed' && ec !== 'Aurum Fitness Club' && ec !== 'null') {
      if (ec.toLowerCase().startsWith('gym:') || ec.toLowerCase().startsWith('gym :')) {
        const parsed = ec.substring(ec.indexOf(':') + 1).trim();
        const isSelf = !isOwner(targetObj) && first && parsed.toLowerCase() === `${first.toLowerCase()} fitness`;
        if (parsed && parsed !== 'Aurum Fitness Club' && !isSelf) {
          return parsed.replace(/([a-z])([A-Z])/g, '$1 $2');
        }
      } else if (!ec.startsWith('+') && !/^[0-9\s\-()]{7,}$/.test(ec)) {
        const isSelf = !isOwner(targetObj) && first && ec.toLowerCase() === `${first.toLowerCase()} fitness`;
        if (!isSelf) return ec;
      }
    }
    if (isOwner(targetObj) && first && first !== 'Gym' && first !== 'User') {
      return `${first} Fitness`;
    }
  }

  // 2. Check currentAuthUser
  if (currentAuthUser) {
    const gn = currentAuthUser.gymName || currentAuthUser.gym_name;
    const first = getCleanFirst(currentAuthUser);
    const selfNamed = !isOwner(currentAuthUser) && first && gn && gn.toLowerCase() === `${first.toLowerCase()} fitness`;
    if (gn && gn !== 'Aurum Fitness Club' && gn !== 'Fitness Club' && gn !== 'Fitness Center' && !selfNamed) {
      return gn;
    }
    if (isOwner(currentAuthUser) && first && first !== 'Gym' && first !== 'User') {
      return `${first} Fitness`;
    }
  }

  // 3. Fallback to active localStorage user
  try {
    const saved = localStorage.getItem('gym_active_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.gymName || parsed?.gym_name) return parsed.gymName || parsed.gym_name;
    }
  } catch (e) {}

  return 'Sabari Fitness';
};

const normalizeUser = (u) => {
  if (!u) return null;
  const rawRole = String(u.user_role || u.role || '').trim();
  let userRole = 'Member';
  if (/^owner$/i.test(rawRole)) userRole = 'Owner';
  else if (/^trainer$/i.test(rawRole)) userRole = 'Trainer';
  else if (/^staff$|^manager$/i.test(rawRole)) userRole = 'Staff';
  else if (/^member$/i.test(rawRole)) userRole = 'Member';
  else if (rawRole) userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  const firstName = u.user_first_name || (u.name ? u.name.split(' ')[0] : 'Gym');
  const lastName = u.user_last_name || (u.name && u.name.includes(' ') ? u.name.substring(u.name.indexOf(' ') + 1) : '');
  const email = (u.user_email || u.email || '').toLowerCase().trim();
  const phone = u.user_phone || u.phone || '+1 555-0100';
  const status = u.user_status || u.status || 'Active';

  const gymName = getGymDisplayName(u, null);

  return {
    ...u,
    role: userRole,
    user_role: userRole,
    user_first_name: firstName,
    user_last_name: lastName,
    user_email: email,
    email: email,
    user_phone: phone,
    phone: phone,
    user_status: status,
    status: status,
    gymName,
    gym_name: gymName
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // First check localStorage for persistent session
        const savedUser = localStorage.getItem('gym_active_user');
        if (savedUser) {
          try {
            const parsed = normalizeUser(JSON.parse(savedUser));
            setUser(parsed);
            setRole(parsed.user_role);
          } catch (e) {}
        }

        // Validate with backend /auth/me
        const res = await api.auth.getMe();
        if (res && res.authenticated && res.data && res.data.user) {
          const norm = normalizeUser(res.data.user);
          setUser(norm);
          setRole(norm.user_role);
          localStorage.setItem('gym_active_user', JSON.stringify(norm));
        } else if (!savedUser) {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.warn('Initial session check notice:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      const rawUser = res?.user || res?.data?.user;
      if (rawUser) {
        const norm = normalizeUser(rawUser);
        setUser(norm);
        setRole(norm.user_role);
        localStorage.setItem('gym_active_user', JSON.stringify(norm));
        return { success: true, user: norm };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signupOwner = async (data) => {
    setError(null);
    try {
      const res = await api.auth.signupOwner(data);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyOwnerOtp = async (email, otp) => {
    setError(null);
    try {
      const res = await api.auth.verifyOwnerOtp({ email, otp });
      const rawUser = res.data?.user || res.user || res.data;
      if (rawUser) {
        const userObj = normalizeUser(rawUser);
        userObj.user_role = 'Owner';
        userObj.role = 'Owner';
        setUser(userObj);
        setRole('Owner');
        localStorage.setItem('gym_active_user', JSON.stringify(userObj));
        return { success: true, user: userObj, message: res.message };
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resendOwnerOtp = async (email) => {
    setError(null);
    try {
      return await api.auth.resendOwnerOtp(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('gym_active_user');
    // Expire cookie
    document.cookie = 'gym_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  // Helper to switch between real database roles for immediate testing
  const switchRole = async (targetEmail) => {
    setLoading(true);
    try {
      const res = await api.auth.login(targetEmail);
      const rawUser = res?.user || res?.data?.user;
      if (rawUser) {
        const norm = normalizeUser(rawUser);
        setUser(norm);
        setRole(norm.user_role);
        localStorage.setItem('gym_active_user', JSON.stringify(norm));
      }
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentUser = (rawUser) => {
    if (!rawUser) return null;
    const norm = normalizeUser(rawUser);
    setUser(norm);
    setRole(norm.user_role);
    localStorage.setItem('gym_active_user', JSON.stringify(norm));
    return norm;
  };

  const updateGymName = async (newGymName) => {
    if (!newGymName || !newGymName.trim()) return;
    const clean = newGymName.trim();
    try {
      await api.auth.updateGymName(clean, user?.email || user?.user_email, user?.ROWID || user?.id);
    } catch (e) {
      console.warn('API gym update note:', e);
    }
    if (user) {
      const updated = {
        ...user,
        gymName: clean,
        gym_name: clean,
        emergencyContact: 'Gym: ' + clean,
        emergency_contact: 'Gym: ' + clean
      };
      setUser(updated);
      localStorage.setItem('gym_active_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        signupOwner,
        verifyOwnerOtp,
        resendOwnerOtp,
        setCurrentUser,
        updateGymName,
        logout,
        switchRole
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
