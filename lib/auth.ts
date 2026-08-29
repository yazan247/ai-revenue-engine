import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "./db";
import type { Account, AuthSession } from "./auth-contract";

const COOKIE = "invoicepilot_session";
const DAYS = 7;
function hashPassword(password: string, salt = randomBytes(16).toString("hex")) { return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(":"); if (!salt || !hash) return false; const actual=scryptSync(password,salt,64), expected=Buffer.from(hash,"hex"); return expected.length===actual.length && timingSafeEqual(actual,expected); }
function hashToken(token:string) { return createHash("sha256").update(token).digest("hex"); }
function makeToken() { return randomBytes(32).toString("base64url"); }
function cookie(token:string,maxAge=DAYS*86400) { return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`; }

export async function register(email:string,name:string,password:string):Promise<Account> {
  const row=(await getDb().query("insert into accounts (id,email,name,password_hash) values ($1,$2,$3,$4) returning id,email,name,created_at",[randomUUID(),email.trim().toLowerCase(),name.trim(),hashPassword(password)])).rows[0];
  return {id:row.id,email:row.email,name:row.name,createdAt:row.created_at.toISOString()};
}
export async function login(email:string,password:string) {
  const row=(await getDb().query("select id,email,name,password_hash from accounts where email=$1",[email.trim().toLowerCase()])).rows[0];
  if(!row || !verifyPassword(password,row.password_hash)) return null;
  const token=makeToken(), expires=new Date(Date.now()+DAYS*86400000);
  await getDb().query("insert into auth_sessions (id,account_id,token_hash,expires_at) values ($1,$2,$3,$4)",[randomUUID(),row.id,hashToken(token),expires]);
  return {account:{id:row.id,email:row.email,name:row.name},token};
}
function readCookie(request:Request){return request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1) ?? null;}
export async function session(request:Request):Promise<AuthSession|null>{
  const token=readCookie(request); if(!token) return null;
  const row=(await getDb().query("select s.account_id,s.expires_at,a.email from auth_sessions s join accounts a on a.id=s.account_id where s.token_hash=$1 and s.expires_at>now()",[hashToken(token)])).rows[0];
  if(!row) return null;
  return {accountId:row.account_id,email:row.email,expiresAt:new Date(row.expires_at).toISOString()};
}
export async function logout(request:Request){const token=readCookie(request);if(token) await getDb().query("delete from auth_sessions where token_hash=$1",[hashToken(token)]);}
export function sessionCookie(token:string){return cookie(token);}
export function clearSessionCookie(){return cookie("",0);}
