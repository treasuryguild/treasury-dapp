import Link from 'next/link';

const Nav = () => {
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          <Link href='/transaction' className="navitems">
            Build Transaction
          </Link>
          <Link href='/txhistory' className="navitems">
            Transaction History
          </Link>
    </nav>
  );
};

export default Nav;