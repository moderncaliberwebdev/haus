'use client'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className='site-header'>
      <div className='brand'>
        {pathname === '/' && (
          <>
            <Image src='/logo.png' alt='Haus Logo' width={28} height={28} />
            <span className='brand-text'>HAUS</span>
          </>
        )}
      </div>
      <button className='hamburger' aria-label='Menu' type='button'>
        <span />
        <span />
        <span />
      </button>
    </header>
  )
}


