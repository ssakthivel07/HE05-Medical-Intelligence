import Link from 'next/link'
import { getServerUser } from '../lib/supabase/ssrClient'

export default async function HomePage() {
  let user = null
  try {
    const result = await getServerUser()
    user = result.user
  } catch {
    user = null
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-blue-500 selection:text-white">
      {/* Sticky Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              +
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                Medical Timeline
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                AI Health Intelligence
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/doctor"
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Doctor Portal
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs"
                >
                  Open Dashboard →
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs"
                >
                  <span>Get Started</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            Next-Generation Healthcare SaaS • Grounded Document Intelligence
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl leading-[1.15]">
            Your Complete Medical History.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
              One Unified Timeline.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Consolidate fragmented hospital summaries, diagnostic scans, lab reports, and prescriptions into a single chronological ledger. Backed by verified AI extraction, duplicate test warnings, and multi-profile family access.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Launch Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-7 py-3.5 text-sm sm:text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Start Free Patient Account</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Sign In / Demo Login</span>
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Zero hallucinated diagnoses
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Granular Row Level Security
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Short-lived signed document URLs
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Multi-profile household support
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mockup / Product Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-20">
        <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl overflow-hidden">
          {/* Mockup Topbar */}
          <div className="h-10 px-4 bg-zinc-100 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 font-mono text-[11px] text-zinc-400">medical-timeline.health/dashboard</span>
            </div>
            <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
              Active Patient: Ananya Sharma (Demo)
            </span>
          </div>

          {/* Mockup Body Preview */}
          <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-950/40 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Chronological Medical Stream
                </span>
                <span className="text-xs text-emerald-600 font-semibold">100% Traceable</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                    🩸
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        Complete Blood Count (CBC)
                      </span>
                      <span className="text-[11px] text-zinc-400">Sep 18, 2026</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Hemoglobin 13.8 g/dL, WBC 7,200/mcL, Platelets 260,000/mcL. All parameters within normal limits.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Verified
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        Cited from Page 1 • Quest Diagnostics
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    🏥
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        Appendectomy Recovery Consultation
                      </span>
                      <span className="text-[11px] text-zinc-400">Sep 01, 2026</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Surgical wound clean and intact. Sutures removed without complications. Clearance for normal activity.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        Discharge Letter
                      </span>
                      <span className="text-[10px] text-zinc-500">Dr. Sarah Jenkins, General Surgery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights & Alerts Column */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                Clinical Intelligence
              </span>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <span>⚠️</span>
                  <span>Duplicate Test Alert</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  CBC performed on Sep 18 (14 days ago). Review previous findings before ordering duplicate lab work.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  Active Medication Slots
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <span className="font-medium">Amoxicillin 500mg</span>
                    <span className="text-[11px] text-zinc-400">8:00 AM • Morning</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <span className="font-medium">Paracetamol 650mg</span>
                    <span className="text-[11px] text-zinc-400">SOS • As needed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem vs The Solution Grid */}
      <section className="py-16 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Healthcare Continuity Broken
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
              Why Patients & Doctors Need a Unified Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Problem */}
            <div className="p-6 sm:p-8 rounded-2xl bg-red-50/50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 space-y-4">
              <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400 font-bold text-lg">
                <span>❌</span>
                <h3>The Fragmented Status Quo</h3>
              </div>
              <ul className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span><strong>Lost & Scattered Records:</strong> Critical clinical documents trapped in paper folders, email attachments, and multiple disconnected hospital portals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span><strong>Unnecessary Duplicate Tests:</strong> Patients undergo repeated blood tests and scans simply because the new doctor cannot find results from two weeks ago.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span><strong>Medication Blindspots:</strong> Dangerous dosage conflicts and drug interactions go unnoticed across different prescribing specialists.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span><strong>Caregiver Isolation:</strong> Elderly parents and dependent children struggle to communicate comprehensive histories to clinical teams.</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                <span>✅</span>
                <h3>The Medical Timeline Solution</h3>
              </div>
              <ul className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Unified Chronological Ledger:</strong> Every diagnosis, surgery, lab report, and prescription unified into an interactive, filterable timeline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Clinical Duplicate Detection:</strong> Automated flags alert doctors when valid diagnostic tests were performed within recent clinical windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Medication Regimen Visualizer:</strong> Clear daily schedule slots (Morning, Afternoon, Evening, Bedtime) with dosage warnings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Multi-Profile & Doctor Access:</strong> Manage your entire household under one account, and share temporary signed records with attending clinicians.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            End-to-End Capabilities
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Engineered for Patients, Caregivers, and Doctors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              📄
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              AI Document Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Upload PDF reports or camera photos. Our vision extraction extracts diagnoses, symptoms, lab values, and prescriptions with exact page citations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              ⏱️
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Interactive Medical Timeline
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Grouped by year and month. Filter by event type, search clinical keywords, and inspect original signed source documents in one click.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
              💊
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Medication & Regimen Tracker
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Organized into Morning, Afternoon, Evening, and Bedtime slots. Complete with active prescription badges and clinical safety disclaimers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              🩺
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Dedicated Doctor Portal
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Rapid 60-second patient chart review designed for clinicians. Highlights active medications, duplicate test alerts, and signed records.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              👨‍👩‍👧
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Multi-Profile Family Access
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Manage accounts for elderly parents, children, or wards under one login. Strictly isolated by database Row Level Security.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-lg">
              🎙️
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Grounded AI Health Assistant
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Voice & text search with Web Speech API. Answers strictly from your clinical documents with citations and zero hallucination.
            </p>
          </div>
        </div>
      </section>

      {/* Security & HIPAA Privacy Banner */}
      <section className="bg-zinc-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            🔒 Patient Privacy & Enterprise Architecture
          </div>
          <h2 className="text-3xl font-bold tracking-tight max-w-2xl mx-auto">
            Bank-Grade Security Built Into Every Layer
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            All documents are stored in private encrypted object buckets accessible only via temporary signed URLs. Row Level Security guarantees data isolation between patients.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 max-w-3xl mx-auto text-center">
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="font-bold text-xl text-blue-400">100%</div>
              <div className="text-xs text-zinc-400 mt-1">RLS Protected</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="font-bold text-xl text-emerald-400">0</div>
              <div className="text-xs text-zinc-400 mt-1">Public Document URLs</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="font-bold text-xl text-purple-400">256-bit</div>
              <div className="text-xs text-zinc-400 mt-1">Storage Encryption</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
              <div className="font-bold text-xl text-amber-400">Immutable</div>
              <div className="text-xs text-zinc-400 mt-1">Audit Trail</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Experience Medical Timeline Today
        </h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Create a free account or explore our pre-loaded fictional demo patient (Ananya Sharma) to test the complete platform in under 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md"
            >
              Open Your Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition"
              >
                Sign In / Demo Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-500 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            Medical Timeline — Unified Patient Assistance & Clinical History Platform
          </p>
          <p className="text-[11px] text-zinc-400 max-w-xl mx-auto">
            Notice: This application is designed for health records aggregation, scheduling assistance, and personal health tracking. It does not replace professional medical diagnosis or clinical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
