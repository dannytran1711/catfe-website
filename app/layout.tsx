import type { Metadata } from 'next';
export const metadata:Metadata={title:'CATFE — Thiên đường mèo',description:'Ba nhà CATFE tại Sài Gòn. Mỗi bé một tính, mỗi lần ghé một niềm vui.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
