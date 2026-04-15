import { supabase } from '../lib/supabase'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  
  const token = req.headers.authorization?.split(' ')[1]
  const user = jwt.verify(token, process.env.JWT_SECRET)
  
  const { data } = await supabase.from('orders').select('*')
  res.json(data)
}