import Image from 'next/image'
import styles from '../page.module.scss'

type Props = {
  roomCode: string
  nickname: string
  setNickname: (v: string) => void
  playersCount: number
  playerNames: string[]
  codeText: string
  onClose: () => void
}

export function StartCard({ roomCode, nickname, setNickname, playersCount, playerNames, codeText, onClose }: Props) {
  const imgs = ['/king.png', '/queen.png', '/jack.png']
  return (
    <div className={styles.startCard}>
      <button className={styles.closeBtn} aria-label='Close start card' type='button' onClick={onClose}>
        ×
      </button>
      <h2 className={styles.startTitle}>Join at hausnow.club</h2>
      <div className={styles.joinInfo}>Enter Room Code</div>
      <div className={styles.roomCode}>{roomCode}</div>

      <div className={styles.joinForm}>
        <label className={styles.inputGroup}>
          <span>Enter Nickname</span>
          <input type='text' placeholder='Your name' value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
      </div>

      <div className={styles.waiting}>Waiting for players{codeText}</div>

      <div className={styles.avatarsRow}>
        {playerNames.slice(0, 3).map((name, idx) => (
          <div className={styles.avatarItem} key={idx}>
            <Image src={imgs[idx]} alt={`player ${idx + 1}`} width={64} height={64} />
            <div className={styles.avatarName}>{name}</div>
          </div>
        ))}
      </div>

      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={playersCount < 3 || !nickname.trim()}>
        Start Game Now
      </button>
    </div>
  )
}


