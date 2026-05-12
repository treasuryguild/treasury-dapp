import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data, error } = await supabase
    .from('tokens')
    .select('ticker, fingerprint, decimals, coingecko_name')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const tickerApiNames: Record<string, string> = {}
  const tickerFingerprints: Record<string, string> = {}
  const tickerDecimals: Record<string, number> = {}

  for (const token of data) {
    if (token.ticker) {
      tickerApiNames[token.ticker] = token.coingecko_name ?? ''
      tickerFingerprints[token.ticker] = token.fingerprint ?? ''
      tickerDecimals[token.ticker] = token.decimals ?? 0
    }
  }

  res.status(200).json({ tickerApiNames, tickerFingerprints, tickerDecimals })
}
