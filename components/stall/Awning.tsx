import styles from './Awning.module.css'

/**
 * The striped canopy every golgappa thela has, with a string of bunting under
 * it. Pure decoration: hidden from assistive tech, pure CSS, no images.
 */
export function Awning() {
  return (
    <div className={styles.awning} aria-hidden="true">
      <div className={styles.stripes} />
      <div className={styles.scallops} />
      <ul className={styles.bunting}>
        {Array.from({length: 18}, (_, i) => (
          <li key={i} className={styles.flag} style={{animationDelay: `${(i % 6) * 0.35}s`}} />
        ))}
      </ul>
    </div>
  )
}
