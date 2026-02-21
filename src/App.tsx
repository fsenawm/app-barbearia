import { useState } from 'react'
import Layout from './components/Layout'
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
    const [currentScreen, setCurrentScreen] = useState('dashboard')

    return (
        <>
            <OfflineBanner />
            <Layout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
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
