import {tenantAdmin} from '../server/firebase-admin.js';
import {createR2} from '../server/r2.js';
import {createVillaService} from '../server/villa-service.js';
export const config={api:{bodyParser:{sizeLimit:'128kb'}}};
export function allowedOrigins(value=process.env.ALLOWED_ORIGINS){
 const origins=String(value||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!origins.length||origins.some(s=>{try{const u=new URL(s);return u.protocol!=='https:'||u.origin!==s;}catch{return true;}}))throw new Error('ALLOWED_ORIGINS configuration');
 return origins;
}
export function makeHandler({admin=tenantAdmin,storage=createR2,origins=allowedOrigins}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
  try{
   if(!origins().includes(req.headers.origin))return res.status(403).json({error:'origin'});
   res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
   res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Max-Age','600');
   if(req.method==='OPTIONS')return res.status(204).end();
   if(req.method!=='POST')return res.status(405).json({error:'method'});
   const token=/^Bearer ([^\s]+)$/.exec(req.headers.authorization||'')?.[1];if(!token)return res.status(401).json({error:'session'});
   const {auth,db}=admin();let identity;
   try{identity=await auth.verifyIdToken(token,true);}catch{return res.status(401).json({error:'session'});}
   const user=await db.collection('users').doc(identity.uid).get();if(user.data()?.role!=='admin')return res.status(403).json({error:'session'});
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
   if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>131072)return res.status(400).json({error:'invalid'});
   const {action,...args}=body;
   if(!['presign','complete','save','remove','discard','cleanup'].includes(action))return res.status(400).json({error:'invalid'});
   const result=await createVillaService(db,storage())[action](args);return res.status(200).json(result);
  }catch(error){
   if(error instanceof SyntaxError)return res.status(400).json({error:'invalid'});
   const code=error?.code?.startsWith('villa/')?error.code.slice(6):null;
   if(code)return res.status(code==='conflict'||code==='referenced'?409:400).json({error:code});
   console.error('Tourist image API failed',error?.code||error?.name||'error');
   return res.status(503).json({error:'connection'});
  }
 };
}
export default makeHandler();
