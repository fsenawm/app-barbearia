import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Agenda from './components/Agenda'
import Booking from './components/Booking'
import Clients from './components/Clients'
import Financial from './components/Financial'
import Ranking from './components/Ranking'
import Schedules from './components/Schedules'
import Services from './components/Services'
import OfflineBanner from './components/OfflineBanner'

function App() {
    const { user, loading, signOut } = useAuth()
    const [currentScreen, setCurrentScreen] = useState('dashboard')
    const [currentPayload, setCurrentPayload] = useState<any>(null)

    const handleNavigate = (screen: string, payload?: any) => {
        setCurrentScreen(screen)
        setCurrentPayload(payload || null)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111a21] flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-5xl animate-pulse" translate="no">content_cut</span>
            </div>
        )
    }

    if (!user) {
        return <Auth />
    }

    const userName = (user.user_metadata?.name as string | undefined) || user.email || ''

    return (
        <>
            <OfflineBanner />
            <Layout
                currentScreen={currentScreen}
                onNavigate={handleNavigate}
                onSignOut={signOut}
                userName={userName}
            >
                {currentScreen === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
                {currentScreen === 'agenda' && <Agenda onNavigate={handleNavigate} />}
                {currentScreen === 'booking' && <Booking onNavigate={handleNavigate} payload={currentPayload} />}
                {currentScreen === 'clientes' && <Clients onNavigate={handleNavigate} />}
                {currentScreen === 'financeiro' && <Financial onNavigate={handleNavigate} />}
                {currentScreen === 'ranking' && <Ranking onNavigate={handleNavigate} />}
                {currentScreen === 'schedules' && <Schedules onNavigate={handleNavigate} />}
                {currentScreen === 'servicos' && <Services onNavigate={handleNavigate} />}
            </Layout>
        </>
    )
}

export default App
