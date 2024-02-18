type DevtoolsSectionProps = {
  heading: string
  children: React.ReactNode
}

function DevtoolsSection({
  heading,
  children,
}: DevtoolsSectionProps): JSX.Element {
  return (
    <div className="border-b dark:border-gray-700">
      <h4 className="text-sm font-semibold mb-1 bg-gray-100 dark:bg-gray-900 p-1 text-white">
        {heading}
      </h4>
      <div className="p-1 dark:text-gray-300">{children}</div>
    </div>
  )
}

export default DevtoolsSection
