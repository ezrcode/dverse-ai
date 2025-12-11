'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'es' | 'en';

const translations: Record<Lang, Record<string, string>> = {
    es: {
        sidebar_newChat: 'Nuevo chat',
        sidebar_environments: 'Entornos',
        sidebar_allEnvs: 'Todos los entornos',
        sidebar_addEnv: 'Agregar entorno',
        sidebar_conversations: 'Conversaciones',
        sidebar_settings: 'Ajustes',
        sidebar_profile: 'Perfil',
        sidebar_logout: 'Salir',
        sidebar_rename: 'Renombrar',
        sidebar_delete: 'Eliminar',
        sidebar_lang_es: 'Español',
        sidebar_lang_en: 'Inglés',
    },
    en: {
        sidebar_newChat: 'New Chat',
        sidebar_environments: 'Environments',
        sidebar_allEnvs: 'All Environments',
        sidebar_addEnv: 'Add Environment',
        sidebar_conversations: 'Conversations',
        sidebar_settings: 'Settings',
        sidebar_profile: 'Profile',
        sidebar_logout: 'Logout',
        sidebar_rename: 'Rename',
        sidebar_delete: 'Delete',
        sidebar_lang_es: 'Spanish',
        sidebar_lang_en: 'English',
    },
};

interface I18nContextValue {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
    lang: 'es',
    setLang: () => {},
    t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>('es');

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
        if (stored === 'en' || stored === 'es') {
            setLangState(stored);
        }
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        if (typeof window !== 'undefined') {
            localStorage.setItem('lang', l);
        }
    };

    const t = (key: string) => translations[lang][key] || key;

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}

