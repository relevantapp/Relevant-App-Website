import Link from 'next/link'
import NavBar from '@/components/NavBar'

export default function NotFound() {
  return (
    <>
      <NavBar items={[{ label: 'Home', href: '/' }]} />

      <main className="section" style={{ padding: '140px 24px 120px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.24em', fontSize: '12px', opacity: 0.6 }}>
            404
          </p>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: '-0.03em', marginTop: '16px' }}>
            This page does not exist
          </h1>
          <p style={{ opacity: 0.72, maxWidth: '520px', margin: '16px auto 32px' }}>
            The link is broken or the page has moved. Head back to the homepage to keep exploring.
          </p>
          <Link href="/" className="btn btn-primary btn-large">
            Go home
          </Link>
        </div>
      </main>
    </>
  )
}
