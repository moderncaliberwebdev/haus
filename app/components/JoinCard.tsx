import Image from 'next/image'
import styles from '../page.module.scss'

type Props = {
  hasJoined: boolean
  joinCode: string
  nickname: string
  joinError: string
  codeText: string
  playerNames: string[]
  hostDisconnected: boolean
  onClose: () => void
  onJoin: () => void
  setJoinCode: (v: string) => void
  setNickname: (v: string) => void
}

export function JoinCard(props: Props) {
  const imgs = ['/king.png', '/queen.png', '/jack.png']
  return (
    <div className={styles.joinCard}>
      <button
        className={styles.closeBtn}
        aria-label='Close join card'
        type='button'
        onClick={props.onClose}
      >
        ×
      </button>
      <h2 className={styles.joinTitle}>Join a Game</h2>
      {!props.hasJoined ? (
        <div className={styles.joinForm}>
          <label className={styles.inputGroup}>
            <span>Enter Room Code</span>
            <input
              type='text'
              placeholder='e.g. ABCDE'
              value={props.joinCode}
              onChange={(e) => props.setJoinCode(e.target.value.toUpperCase())}
            />
          </label>
          <label className={styles.inputGroup}>
            <span>Enter Nickname</span>
            <input
              type='text'
              placeholder='Your name'
              value={props.nickname}
              onChange={(e) => props.setNickname(e.target.value)}
            />
          </label>
          <button
            className={`${styles.btn} ${styles.btnBlue}`}
            onClick={props.onJoin}
          >
            Join Game
          </button>
          {props.joinError && (
            <div className={styles.errorText}>{props.joinError}</div>
          )}
        </div>
      ) : (
        <>
          {props.playerNames.length == 3 ? (
            <div className={`${styles.waiting} ${styles.blue}`}>
              Waiting for host to start game{props.codeText}
            </div>
          ) : (
            <div className={`${styles.waiting} ${styles.blue}`}>
              Waiting for other players{props.codeText}
            </div>
          )}

          {props.hostDisconnected && (
            <div className={styles.errorText}>The host has disconnected.</div>
          )}
          <div className={styles.avatarsRow}>
            {props.playerNames.slice(0, 3).map((name, idx) => (
              <div className={styles.avatarItem} key={idx}>
                <Image
                  src={imgs[idx]}
                  alt={`player ${idx + 1}`}
                  width={64}
                  height={64}
                />
                <div className={`${styles.avatarName} ${styles.blue}`}>
                  {name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
