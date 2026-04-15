const fs = require('fs')
const path = require('path')

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

/* ================= ROOT ================= */

write('package.json', JSON.stringify({
  name: "mikami-store",
  version: "1.0.0",
  dependencies: {
    "@supabase/supabase-js": "^2.0.0",
    "jsonwebtoken": "^9.0.0"
  }
}, null, 2))

/* ================= LIB ================= */

write('lib/supabase.js', `
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
`)

write('lib/middleware.js', `
import jwt from 'jsonwebtoken'

export function verifyToken(req){
  try{
    const auth = req.headers.authorization
    if(!auth) return null
    const token = auth.split(' ')[1]
    return jwt.verify(token, process.env.JWT_SECRET)
  }catch{
    return null
  }
}

export function requireAdmin(req){
  const user = verifyToken(req)
  if(!user || user.role !== 'admin') return null
  return user
}
`)

/* ================= API ================= */

write('api/auth.js', `
import jwt from 'jsonwebtoken'

export default function handler(req,res){
  const { email,password } = req.body

  if(email==='admin@test.com' && password==='123456'){
    const token = jwt.sign(
      { id:1, role:'admin' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )
    return res.json({ token })
  }

  res.status(401).json({ error:'Invalid login' })
}
`)

write('api/orders.js', `
import { supabase } from '../lib/supabase'
import { verifyToken } from '../lib/middleware'

export default async function handler(req,res){
  const user = verifyToken(req)
  if(!user) return res.status(401).json({error:'Unauthorized'})

  if(req.method==='POST'){
    const { product,player_id } = req.body

    const { data:prod } = await supabase
      .from('products')
      .select('*')
      .eq('name', product)
      .single()

    const amount = prod.price

    const { data:wallet } = await supabase
      .from('wallet')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if((wallet?.balance||0) < amount){
      return res.json({error:'Insufficient balance'})
    }

    await supabase.from('wallet')
      .update({ balance: wallet.balance - amount })
      .eq('user_id', user.id)

    await supabase.from('orders').insert({
      user_id:user.id,
      product,
      player_id,
      amount,
      status:'processing'
    })

    return res.json({success:true})
  }

  if(req.method==='GET'){
    const { data } = await supabase.from('orders').select('*')
    return res.json(data)
  }
}
`)

write('api/products.js', `
import { supabase } from '../lib/supabase'
import { verifyToken } from '../lib/middleware'

export default async function handler(req,res){

  if(req.method==='GET'){
    const { data } = await supabase.from('products').select('*')
    return res.json(data)
  }

  const user = verifyToken(req)
  if(!user) return res.status(401).json({error:'Unauthorized'})

  if(req.method==='POST'){
    const { name,price } = req.body
    await supabase.from('products').insert({ name,price })
    return res.json({success:true})
  }
}
`)

write('api/payments.js', `
import { supabase } from '../lib/supabase'

export default async function handler(req,res){
  const { data } = await supabase.from('payments').select('*')
  res.json(data)
}
`)

/* ================= PUBLIC ================= */

write('public/user.html', `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-black text-white p-4">

<h1 class="text-xl mb-4">MIKAMI STORE</h1>

<input id="player" placeholder="Player ID" class="p-2 w-full mb-2 bg-gray-800">

<button onclick="buy()" class="bg-purple-600 p-2 w-full rounded">
Buy Pack
</button>

<script>
function buy(){
fetch('/api/orders',{
method:'POST',
headers:{
'Content-Type':'application/json',
'Authorization':'Bearer '+localStorage.token
},
body: JSON.stringify({
product:'100 Diamonds',
player_id:document.getElementById('player').value
})
})
.then(r=>r.json())
.then(r=>alert(r.success?'Done':r.error))
}
</script>

</body>
</html>
`)

write('public/admin.html', `
<!DOCTYPE html>
<html>
<body style="background:black;color:white">

<h2>MIKAMI ADMIN</h2>

<button onclick="load()">Load Orders</button>
<div id="data"></div>

<script>
function load(){
fetch('/api/orders',{
headers:{'Authorization':'Bearer '+localStorage.token}
})
.then(r=>r.json())
.then(d=>{
document.getElementById('data').innerHTML =
JSON.stringify(d,null,2)
})
}
</script>

</body>
</html>
`)

console.log("MIKAMI STORE FULL BUILD READY ✅")