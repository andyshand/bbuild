import React, { useState } from 'react'

interface FlowProps {
  steps: { element: React.ReactNode }[]
}

const FlowButton: React.FC<{
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-500 text-white rounded"
    disabled={disabled}
  >
    {children}
  </button>
)

const Flow: React.FC<FlowProps> = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        Step {currentStep + 1} of {steps.length}
      </div>
      {steps[currentStep].element}
      <div className="flex mt-4">
        <FlowButton onClick={goBack} disabled={currentStep === 0}>
          Back
        </FlowButton>
        <FlowButton
          onClick={goForward}
          disabled={currentStep === steps.length - 1}
        >
          Forward
        </FlowButton>
      </div>
    </div>
  )
}

export default Flow
