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
                onNavigate={setCurrentScreen}
                onSignOut={signOut}
                userName={userName}
            >
                {currentScreen === 'dashboard' && <Dashboard onNavigate={setCurrentScreen} />}
                {currentScreen === 'agenda' && <Agenda onNavigate={setCurrentScreen} />}
                {currentScreen === 'booking' && <Booking onNavigate={setCurrentScreen} />}
                {currentScreen === 'clientes' && <Clients onNavigate={setCurrentScreen} />}
                {currentScreen === 'financeiro' && <Financial onNavigate={setCurrentScreen} />}
                {currentScreen === 'ranking' && <Ranking onNavigate={setCurrentScreen} />}
                {currentScreen === 'schedules' && <Schedules onNavigate={setCurrentScreen} />}
                {currentScreen === 'servicos' && <Services onNavigate={setCurrentScreen} />}
            </Layout>
        </>
    )
}

export default App
