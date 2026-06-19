import { useNavigate } from 'react-router-dom'

/**
 * crumbs: [{ label, tag, to }]  — last one rendered as current/non-clickable
 */
export function BlueprintPath({ crumbs }) {
  const navigate = useNavigate()
  return (
    <div className="blueprint-path">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <div className={`crumb${isLast ? ' current' : ''}`} key={i}>
            <span className="crumb-tag">{c.tag}</span>
            {isLast || !c.to ? (
              <span>{c.label}</span>
            ) : (
              <button onClick={() => navigate(c.to)}>{c.label}</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
