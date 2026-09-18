"use client"

import { useState, useEffect } from 'react'
import type { PatientProfile } from '../../lib/types'
import Header from './Header'
import Sidebar from './Sidebar'
import GlobalSearchModal from '../search/GlobalSearchModal'
import VoiceAssistantModal from '../assistant/VoiceAssistantModal'

interface DashboardLayoutClientProps {
  patientName: string
  userEmail?: string
  activePatient?: PatientProfile | null
  allProfiles?: PatientProfile[]
  children: React.ReactNode
}

export default function DashboardLayoutClient({
  patientName,
  userEmail,
  activePatient,
  allProfiles = [],
  children,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          patientName={patientName}
          userEmail={userEmail}
          activePatient={activePatient}
          allProfiles={allProfiles}
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenVoiceAssistant={() => setVoiceOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Command Palette */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        activePatientId={activePatient ? String(activePatient.id) : undefined}
      />

      {/* AI Voice Assistant Drawer */}
      <VoiceAssistantModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        activePatientId={activePatient ? String(activePatient.id) : undefined}
      />
    </div>
  )
}
