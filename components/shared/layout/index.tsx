import Header from "./Header"

type Props = {
  children: React.ReactNode
}

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Header />
      <div className="bg-slate-200 pt-12">{children}</div>
    </>
  )
}

export default Layout
