import { useMemo } from 'react';
import { isPast, isFuture, isSameMonth } from 'date-fns';

export const useMonthLock = (date, userRole = 'chef') => {
    const currentDate = new Date();
    const selectedDate = new Date(date);

    const isLocked = useMemo(() => {
        // Admin peut toujours déverrouiller
        if (userRole === 'admin') return false;

        // Mois passé = verrouillé
        if (selectedDate < currentDate && !isSameMonth(selectedDate, currentDate)) {
            return true;
        }

        // Mois futur = verrouillé
        if (isFuture(selectedDate)) {
            return true;
        }

        return false;
    }, [selectedDate, currentDate, userRole]);

    const lockMessage = useMemo(() => {
        if (!isLocked) return '';
        if (selectedDate < currentDate) return 'MOIS PASSÉ - LECTURE SEULE';
        if (isFuture(selectedDate)) return 'MOIS FUTUR - IMPOSSIBLE DE SAISIR';
        return '';
    }, [isLocked, selectedDate, currentDate]);

    return {
        isLocked,
        lockMessage,
        canEdit: !isLocked,
        unlockForAdmin: userRole === 'admin'
    };
};