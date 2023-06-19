import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";

const Nav = () => {
  const [session, setSession] = useState<Session | null>(null)

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
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
   //console.log(session)
  return (
    <nav className="routes">
          <Link href="/" className="navitems">
            Home
          </Link>
          <Link href='/txbuilder' className="navitems">
            Build Transaction
          </Link>
          <Link href='/transactions' className="navitems">
            Transaction History
          </Link>
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