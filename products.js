import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  const { data } = await supabase.from('products').select('*')
  res.json(data)
}