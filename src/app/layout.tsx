export const metadata = {
  title: 'Makeups Portal BPHC',
  description: 'TimeTable Division BPHC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
