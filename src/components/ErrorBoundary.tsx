import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render-time failures (e.g. the app running before `npx convex dev`
 * has generated the Convex API) and shows a recoverable message instead of a
 * blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <main className="main detail">
            <div className="empty detail__empty">
              <h3>The directory backend isn't connected yet</h3>
              <p>
                Run <code>npx convex dev</code> in the project folder to create
                a Convex deployment, push the backend functions and run the
                first sync. The frontend will pick up real repository data as
                soon as the backend is live.
              </p>
            </div>
          </main>
        </div>
      )
    }
    return this.props.children
  }
}
