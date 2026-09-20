import Link from 'next/link'

import {Golgappa} from './Golgappa'
import styles from './SiteHeader.module.css'

export function SiteHeader({back}: {back?: {href: string; label: string}}) {
  return (
    <>
      <header className={styles.bar}>
        {back ? (
          <Link href={back.href} className={styles.back}>
            ← {back.label}
          </Link>
        ) : (
          <Link href="/" className={styles.brand}>
            <Golgappa state="crisp" size={30} />
            <span className={styles.names}>
              <strong>Pani Kaisa Hai?</strong>
              <span lang="hi" className={styles.hi}>
                पानी कैसा है?
              </span>
            </span>
          </Link>
        )}
      </header>
      <p className={styles.sample}>Sample data — demo build</p>
    </>
  )
}

export function Disclaimer() {
  return (
    <p className={styles.disclaimer}>
      Early warning from residents, not a lab test. Alerts are confirmed by a health worker before
      they appear.
    </p>
  )
}
