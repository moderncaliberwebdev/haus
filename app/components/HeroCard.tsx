import Image from 'next/image'
import styles from '../page.module.scss'

export function HeroCard({ onJoin, onStart }: { onJoin: () => void; onStart: () => void }) {
  return (
    <div className={styles.heroCard}>
      <h1 className={styles.title}>Play Haus Now!</h1>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnLight}`} onClick={onJoin}>
          Join a Game
        </button>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onStart}>
          Start a Game
        </button>
      </div>
      <div className={styles.cardCircle}>
        <Image src='/cards.png' alt='Cards' width={160} height={160} className={styles.cardsImg} />
      </div>
    </div>
  )
}


