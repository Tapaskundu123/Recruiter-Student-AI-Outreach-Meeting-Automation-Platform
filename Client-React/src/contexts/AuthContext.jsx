import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/admin/me');
            if (response.data.success) {
                setAdmin(response.data.data);
                setAuthenticated(true);
            }
        } catch (error) {
            setAdmin(null);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/admin/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAdmin(null);
            setAuthenticated(false);
            localStorage.removeItem('admin');
            window.location.href = '/admin/login';
        }
    };

    const value = {
        admin,
        authenticated,
        loading,
        logout,
        checkAuth
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
