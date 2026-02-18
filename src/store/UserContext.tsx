import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  photoUri?: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  updateUser: async () => { },
  logout: async () => { },
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Failed to load user', e);
    }
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    try {
      const newUser = { ...user, ...data } as UserProfile;
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to update user', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
