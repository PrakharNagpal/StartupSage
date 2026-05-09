import { cloneElement, isValidElement } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

export function Button({ children, className = '', variant = 'primary', size = 'default', asChild = false, ...props }) {
  const classes = `btn btn-${variant} btn-${size} ${className}`

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: `${classes} ${children.props.className || ''}`,
      ...props,
    })
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function Badge({ children, className = '', tone = 'neutral' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />
}

export function Separator({ className = '' }) {
  return <div className={`separator ${className}`} />
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner-wrap">
      <Loader2 className="spinner" size={18} />
      <span>{label}</span>
    </span>
  )
}

export function Alert({ title = 'Something went wrong', children, action }) {
  return (
    <div className="alert" role="alert">
      <AlertTriangle size={20} />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
        {action ? <div className="alert-action">{action}</div> : null}
      </div>
    </div>
  )
}
