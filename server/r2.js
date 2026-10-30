import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export const MAX_BYTES = 8 * 1024 * 1024;
export const TYPES = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export function r2Config(env=process.env) {
 const {R2_ACCOUNT_ID:account,R2_ACCESS_KEY_ID:accessKeyId,R2_SECRET_ACCESS_KEY:secretAccessKey,R2_BUCKET_NAME:bucket,R2_PUBLIC_BASE_URL:base}=env;
 if(!/^[a-f0-9]{32}$/.test(account||'')||!accessKeyId||!secretAccessKey||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket||''))throw new Error('R2 configuration');
 const url=new URL(base);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.port)throw new Error('R2 public domain');
 return {bucket,base:url.origin,client:new S3Client({region:'auto',forcePathStyle:true,endpoint:`https://${account}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey},requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'})};
}
export function imageSignature(bytes,type){
 if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/png')return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 return type==='image/webp'&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
}
export function createR2(config=r2Config()) {
 const {client,bucket,base}=config;
 return {
  url:key=>base+'/'+key,
  async sign(key,type,size){return getSignedUrl(client,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:type,ContentLength:size}),{expiresIn:120,signableHeaders:new Set(['content-type','content-length'])});},
  async publish(staging,key,type,size){
   const result=await client.send(new GetObjectCommand({Bucket:bucket,Key:staging}));
   if(result.ContentLength!==size||result.ContentType!==type||size>MAX_BYTES)throw Object.assign(new Error('image'),{code:'villa/image'});
   const chunks=[];let total=0;
   for await(const chunk of result.Body){total+=chunk.length;if(total>MAX_BYTES){result.Body.destroy();throw Object.assign(new Error('image'),{code:'villa/image'});}chunks.push(chunk);}
   const bytes=Buffer.concat(chunks);if(bytes.length!==size||!imageSignature(bytes,type))throw Object.assign(new Error('image'),{code:'villa/image'});
   // Publish the validated bytes to a DIFFERENT key: a reusable staging PUT URL
   // can never overwrite an attached/public image after validation.
   await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:type,ContentLength:size,CacheControl:'public, max-age=31536000, immutable'}));
  },
  async remove(key){await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));}
 };
}
