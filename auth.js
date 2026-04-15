import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

export default async function handler(req,res){

const { email,password } = req.body

const { data:user } = await supabase
.from('users')
.select('*')
.eq('email', email)
.single()

if(!user) return res.json({error:'Invalid'})

const ok = await bcrypt.compare(password, user.password)

if(!ok) return res.json({error:'Invalid'})

const token = jwt.sign(
{ id:user.id, role:user.role },
process.env.JWT_SECRET
)

res.json({ token })
}