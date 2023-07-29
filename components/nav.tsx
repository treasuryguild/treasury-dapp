import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useRouter } from 'next/router';

const Nav = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPrepping, setIsPrepping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToTxbuilder = async () => {
    // Check if the current route is either "/transactions" or "/done" (with any subpath)
    if (['/transactions', '/done'].some(path => router.pathname.startsWith(path))) {
      if (!isNavigating) { // Check if navigation is already in progress
        setIsNavigating(true);
        setIsPrepping(true);
        await router.push('/prep');
        // Simulate prepping time (5 seconds in this example)
        await new Promise((resolve) => setTimeout(resolve, 5000));
        setIsPrepping(false);
        await router.push('/txbuilder');
        setIsNavigating(false); // Reset the navigation flag after completion
      }
    } else {
      await router.push('/txbuilder');
    }
  };  

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
          setIsAdmin(true)
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        if (session?.user?.id === process.env.NEXT_PUBLIC_TREASURY_ADMIN) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      })
      
      return () => subscription.unsubscribe()
    }, [])

    async function signInWithDiscord() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
      })
    }
  
    async function signout() {
      const { error } = await supabase.auth.signOut()
    }
   //console.log(session, isAdmin)
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          <button onClick={navigateToTxbuilder} className="navitems">
            Build Transaction
          </button>
          <Link href='/transactions' className="navitems">
            Transaction History
          </Link>
          <Link href='/mintfungibletokens' className="navitems">
            Mint tokens
          </Link>
          {isAdmin && <Link href='/admin' className="navitems">Admin</Link>}
          {!session && (<button onClick={signInWithDiscord} className="navitems">
          Sign In with Discord
        </button>)}
          {session && (
          <button onClick={signout} className="navitems">
          Sign Out
          </button>)}
    </nav>
  );
};

export default Nav;