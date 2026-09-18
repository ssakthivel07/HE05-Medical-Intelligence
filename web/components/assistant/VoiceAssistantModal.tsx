"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface Citation {
  label: string
  documentId?: string
  date?: string
}

interface AssistantResponse {
  answer: string
  citations: Citation[]
  patientName: string
  disclaimer: string
}

interface VoiceAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  activePatientId?: string
}

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  activePatientId,
}: VoiceAssistantModalProps) {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
      )
    }
    return false
  })
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AssistantResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<unknown>(null)

  const SUGGESTIONS = [
    'What medications are currently listed?',
    'When was my last blood test?',
    'What happened during my previous hospital visit?',
    'What documents were uploaded recently?',
  ]

  const handleQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText.trim(), patientId: activePatientId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to query assistant.')
      } else {
        setResponse(data)
      }
    } catch {
      setError('Network communication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activePatientId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          const rec = new (SpeechRecognition as new () => {
            continuous: boolean
            interimResults: boolean
            lang: string
            onstart: () => void
            onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void
            onerror: (e: { error: string }) => void
            onend: () => void
            start: () => void
            stop: () => void
          })()

          rec.continuous = false
          rec.interimResults = false
          rec.lang = 'en-US'

          rec.onstart = () => setIsListening(true)
          rec.onend = () => setIsListening(false)
          rec.onerror = () => setIsListening(false)

          rec.onresult = (event) => {
            const transcript = event.results[0][0].transcript
            setInputText(transcript)
            setIsListening(false)
            handleQuery(transcript)
          }

          recognitionRef.current = rec
        } catch {
          // Speech recognition init ignored
        }
      }
    }
  }, [handleQuery])

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return

    const rec = recognitionRef.current as { start: () => void; stop: () => void }

    if (isListening) {
      rec.stop()
      setIsListening(false)
    } else {
      setError(null)
      try {
        rec.start()
      } catch {
        setIsListening(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleQuery(inputText)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
                AI Patient Assistant
              </h3>
              <p className="text-xs text-zinc-500">
                Grounded strictly in your verified medical records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Active Listening Animation Banner */}
          {isListening && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 flex items-center justify-center gap-3 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Listening... Speak your question clearly
              </span>
            </div>
          )}

          {/* Assistant Response Panel */}
          {response && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Record Query Answer ({response.patientName})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified Records Only
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                  {response.answer}
                </div>

                {/* Citations */}
                {response.citations && response.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Source Document References
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {response.citations.map((cite, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400"
                        >
                          <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {cite.label} {cite.date ? `(${cite.date})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Disclaimer:</strong> {response.disclaimer}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Quick Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Suggested Questions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInputText(s)
                    handleQuery(s)
                  }}
                  className="p-2 rounded-xl text-xs text-left bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-800 transition"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Microphone Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white border-red-700 animate-pulse'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking with voice input'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </button>
            )}

            <input
              type="text"
              placeholder="Ask a question about medications, tests, or hospital visits..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Ask'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
