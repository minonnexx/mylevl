'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Shield } from 'lucide-react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('splash-shown')) {
      sessionStorage.setItem('splash-shown', '1')
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        onAnimationComplete={() => setVisible(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'var(--color-background)',
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
          <Shield size={64} color="var(--color-accent)" strokeWidth={1.5} />
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            color: 'var(--color-accent)',
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          mylevl
        </motion.span>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          Sube de nivel en la vida real
        </motion.span>

        <div
          style={{
            width: '120px',
            height: '2px',
            backgroundColor: 'var(--color-surface)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.7, duration: 0.8, ease: 'easeInOut' }}
            style={{
              height: '100%',
              backgroundColor: 'var(--color-accent)',
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
