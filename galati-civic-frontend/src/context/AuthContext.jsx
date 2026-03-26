import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});
const ADMIN_ROLE = 'admin';

const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : null);

const getServerClaimRole = (supabaseUser) => {
    if (!supabaseUser) return null;

    const roleCandidates = [
        supabaseUser?.app_metadata?.role,
        supabaseUser?.app_metadata?.claims?.role,
        supabaseUser?.user_metadata?.role,
    ];

    const rolesClaim = supabaseUser?.app_metadata?.roles;
    if (Array.isArray(rolesClaim)) {
        roleCandidates.push(...rolesClaim);
    }

    return roleCandidates
        .map(normalizeRole)
        .find(Boolean) || null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Încarcă profilul extins (rol, nume) din tabela profiles
    const fetchProfile = async (supabaseUser) => {
        if (!supabaseUser) { setProfile(null); return; }
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();
            setProfile(data || null);
        } catch {
            setProfile(null);
        }
    };

    useEffect(() => {
        // Sesiunea curentă la încărcare
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchProfile(u).finally(() => setLoading(false));
        });

        // Listener pentru login/logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchProfile(u);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const register = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
        });
        if (error) throw error;

        // Creăm profilul în tabela profiles
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email,
                full_name: name,
                role: 'user',
            });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    // Token-ul de acces pentru cereri către backend Express
    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    };

    const profileRole = normalizeRole(profile?.role);
    const claimRole = getServerClaimRole(user);
    const isAdmin = profileRole === ADMIN_ROLE || claimRole === ADMIN_ROLE;

    const value = {
        user,
        profile,
        loading,
        isAdmin,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        getToken,
        // Obiect combinat util în componente
        displayName: profile?.full_name || user?.email?.split('@')[0] || 'Utilizator',
        avatarInitial: (profile?.full_name || user?.email || 'U')[0].toUpperCase(),
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#080f1e',
                flexDirection: 'column',
                gap: '14px',
            }}>
                <div style={{
                    width: '36px', height: '36px',
                    border: '3px solid rgba(59,130,246,.2)',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ color: '#4d6380', fontSize: '13px', fontFamily: 'system-ui' }}>
                    Se încarcă...
                </span>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
