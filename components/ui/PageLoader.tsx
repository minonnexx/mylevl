'use client'

import { motion } from 'motion/react'

export default function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        gap: '12px',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontSize: '1.25rem',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        mylevl
      </span>
      <div
        style={{
          width: '80px',
          height: '2px',
          backgroundColor: 'var(--color-surface)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-accent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
