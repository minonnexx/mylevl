'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function SplashScreen() {
  const [show, setShow] = useState(true)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const shown = sessionStorage.getItem('splash-shown')
    if (shown) {
      setShow(false)
      setVisible(false)
      return
    }
    sessionStorage.setItem('splash-shown', 'true')
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => setShow(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'var(--color-background)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-512.png"
              alt="MyLevl"
              style={{ display: 'block', height: 170, width: 170, borderRadius: 'var(--radius-card)' }}
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}
          >
            Sube de nivel en la vida real
          </motion.p>
          <div
            style={{
              width: '120px',
              height: '2px',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              borderRadius: '1px',
            }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.7, duration: 0.8, ease: 'easeInOut' }}
              style={{ height: '100%', background: 'var(--color-accent)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
