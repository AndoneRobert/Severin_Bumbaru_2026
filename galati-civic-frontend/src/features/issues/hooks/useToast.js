import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_TOAST = { msg: '', show: false, type: 'info' };

export const useToast = ({ duration = 3200 } = {}) => {
    const [toast, setToast] = useState(DEFAULT_TOAST);
    const timeoutRef = useRef(null);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, show: false }));
    }, []);

    const showToast = useCallback((msg, type = 'info') => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setToast({ msg, show: true, type });
        timeoutRef.current = setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, duration);
    }, [duration]);

    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    return { toast, showToast, hideToast, setToast };
};

export default useToast;
