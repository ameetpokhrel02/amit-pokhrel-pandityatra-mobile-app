import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    chatVisible: boolean;
    bookingId?: number;
    panditName?: string;
    openChat: (bookingId?: number, panditName?: string) => void;
    closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [chatVisible, setChatVisible] = useState(false);
    const [bookingId, setBookingId] = useState<number | undefined>(undefined);
    const [panditName, setPanditName] = useState<string | undefined>(undefined);

    const openChat = (id?: number, name?: string) => {
        setBookingId(id);
        setPanditName(name);
        setChatVisible(true);
    };

    const closeChat = () => {
        setChatVisible(false);
        // We don't necessarily need to clear bookingId immediately to avoid flickers during close animation
    };

    return (
        <ChatContext.Provider value={{ chatVisible, bookingId, panditName, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
