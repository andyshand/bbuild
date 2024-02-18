import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export type WhatsNewChange = {
  change: string
  href?: string
  onClick?: () => void
}

export type WhatsNewFeature = {
  date: Date
  changes: WhatsNewChange[]
}

export type WhatsNewProps = {
  features: WhatsNewFeature[]
}

export default function WhatsNew({ features: dates }: WhatsNewProps) {
  const [show, setShow] = useState(false)
  const [latestChange, setLatestChange] = useState(
    localStorage.getItem('latestChange')
  )
  const latestFeature = dates[0]
  const latestFeatureChange = latestFeature.changes[0].change

  useEffect(() => {
    if (latestFeatureChange) {
      if (latestFeatureChange !== latestChange) {
        setShow(true)
      }
    }
  }, [dates, latestChange, latestFeatureChange])

  if (!show) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 right-0 m-6 bg-white rounded-lg shadow-lg overflow-hidden dark:bg-gray-800 dark:text-white"
      style={{
        zIndex: 99999,
        boxShadow: '0 -10px 67px rgba(0, 0, 0, 0.33)',
        width: '18.5em',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            What's New
          </h2>
          <button
            className="ml-3 bg-transparent border-0 text-gray-400 hover:text-gray-500"
            onClick={() => {
              setShow(false)
              setLatestChange(latestFeatureChange)
              localStorage.setItem('latestChange', latestFeatureChange)
            }}
          >
            <span className="sr-only">Close panel</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {dates.map((date, i) => (
            <div key={i} className="mt-4">
              <h3 className="text-sm font-semibold text-gray-500">
                {format(date.date, 'MMMM dd, yyyy')}
              </h3>
              <ul className="mt-2 space-y-1">
                {date.changes.map((change, j) => (
                  <li key={j} className="flex items-start">
                    <div className="text-sm">
                      {change.href ? (
                        <a
                          href={change.href}
                          className="font-medium text-gray-900 dark:text-white hover:underline"
                        >
                          {change.change}
                        </a>
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {change.change}
                        </p>
                      )}
                      {change.onClick && (
                        <button
                          className="mt-1 text-sm text-gray-500"
                          onClick={change.onClick}
                        >
                          Learn more
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
