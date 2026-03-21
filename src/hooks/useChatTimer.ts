import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_LIMIT_SECONDS = 15 * 60; // 15 minutes
const STORAGE_KEY_PREFIX = 'chat_remaining_time_';

export function useChatTimer() {
    const [secondsLeft, setSecondsLeft] = useState<number>(DAILY_LIMIT_SECONDS);
    const [isActive, setIsActive] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const getTodayKey = () => {
        const today = new Date().toISOString().split('T')[0];
        return `${STORAGE_KEY_PREFIX}${today}`;
    };

    // Load initial time on mount
    useEffect(() => {
        const loadTime = async () => {
            try {
                const key = getTodayKey();
                const savedTime = await AsyncStorage.getItem(key);
                if (savedTime !== null) {
                    setSecondsLeft(parseInt(savedTime, 10));
                } else {
                    // New day, reset limit
                    setSecondsLeft(DAILY_LIMIT_SECONDS);
                    await AsyncStorage.setItem(key, DAILY_LIMIT_SECONDS.toString());
                }
            } catch (error) {
                console.error('Failed to load chat timer:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTime();
    }, []);

    // Save time periodically or on change
    useEffect(() => {
        let interval: any;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    const next = prev - 1;
                    // Save every 5 seconds to reduce storage writes
                    if (next % 5 === 0) {
                        AsyncStorage.setItem(getTodayKey(), next.toString());
                    }
                    return next;
                });
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsActive(false);
            AsyncStorage.setItem(getTodayKey(), '0');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft]);

    const startTimer = useCallback(() => {
        if (secondsLeft > 0) setIsActive(true);
    }, [secondsLeft]);

    const stopTimer = useCallback(() => {
        setIsActive(false);
        // Final save on stop
        AsyncStorage.setItem(getTodayKey(), secondsLeft.toString());
    }, [secondsLeft]);

    const formattedTime = () => {
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return {
        secondsLeft,
        formattedTime: formattedTime(),
        isActive,
        isLoaded,
        startTimer,
        stopTimer,
        isExpired: secondsLeft <= 0
    };
}
