'use client'
import styles from './WaitingBox.module.scss'

interface WaitingBoxProps {
  message: string
}

export default function WaitingBox({ message }: WaitingBoxProps) {
  return (
    <div className={styles.waitingBox}>
      <div className={styles.waitingText}>{message}</div>
    </div>
  )
}
