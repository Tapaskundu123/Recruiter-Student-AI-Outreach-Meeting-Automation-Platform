import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check if admin data exists in localStorage
            const storedAdmin = localStorage.getItem('admin');
            if (storedAdmin) {
                setAdmin(JSON.parse(storedAdmin));
            }

            // Verify authentication with backend
            const response = await api.verifyAdminAuth();
            if (!response.data.authenticated) {
                logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (adminData) => {
        setAdmin(adminData);
        localStorage.setItem('admin', JSON.stringify(adminData));
    };

    const logout = () => {
        setAdmin(null);
        localStorage.removeItem('admin');
    };

    return (
        <AdminAuthContext.Provider value={{ admin, loading, login, logout, checkAuth }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
}
