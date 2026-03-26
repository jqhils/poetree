import { Layout } from '@/components/dom/Layout'
import '@/global.css'

export const metadata = {
  title: 'Poetree',
  description: 'A space garden of drifting poem-trees.',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='antialiased'>
      <head>
        <link
          href='https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
