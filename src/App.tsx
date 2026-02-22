import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Timer } from './components/Timer';
import { Weather } from './components/Weather';
import { Hacking } from './components/Hacking';
import { Piptris } from './components/Piptris';
import { Settings } from './components/Settings';

export type AppId = 'timer' | 'weather' | 'hacking' | 'piptris' | 'settings';

export default function App() {
    const [activeApp, setActiveApp] = useState<AppId>('timer');
    const [theme, setTheme] = useState('theme-green');
    const [debugMode, setDebugMode] = useState(false);

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    const renderApp = () => {
        switch (activeApp) {
            case 'timer':
                return <Timer debugMode={debugMode} />;
            case 'weather':
                return <Weather />;
            case 'hacking':
                return <Hacking />;
            case 'piptris':
                return <Piptris />;
            case 'settings':
                return <Settings theme={theme} setTheme={setTheme} debugMode={debugMode} setDebugMode={setDebugMode} />;
            default:
                return <Timer debugMode={debugMode} />;
        }
    };

    return (
        <Layout activeApp={activeApp} setActiveApp={setActiveApp}>
            {renderApp()}
        </Layout>
    );
}
