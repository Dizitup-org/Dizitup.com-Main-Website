import React from 'react'

type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any) {
    console.error('[UI Error]', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-white/60">Please refresh or try again.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
