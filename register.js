import { supabase } from '../lib/supabase'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export default async function handler(req,res){

const { email,password } = req.body

const hash = await bcrypt.hash(password,10)

const { data:user } = await supabase
.from('users')
.insert({ email, password:hash })
.select()
.single()

await supabase.from('wallet').insert({ user_id:user.id })

const token = jwt.sign(
{ id:user.id, role:'user' },
process.env.JWT_SECRET
)

res.json({ token })
}