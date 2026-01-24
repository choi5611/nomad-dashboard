import React, { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * React Error Boundary
 * 렌더링 중 발생하는 에러를 포착하여 앱 전체가 크래시되는 것을 방지합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (프로덕션에서는 Sentry 등의 서비스로 전송)
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 Fallback UI가 제공되었다면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 화면
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Oops! Something went wrong</h1>
                <p className="text-sm text-white/50">렌더링 중 오류가 발생했습니다</p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border border-white/5">
                <p className="text-xs text-red-400 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                      Stack trace
                    </summary>
                    <pre className="text-[10px] text-white/30 mt-2 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
              >
                새로고침
              </button>
            </div>

            <p className="text-xs text-white/30 text-center mt-6">
              문제가 지속되면 페이지를 새로고침해주세요
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
