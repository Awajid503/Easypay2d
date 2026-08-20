const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const page=b=>new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>Easypay</title>${b}`,{headers:{"content-type":"text/html;charset=UTF-8"}});
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(request.method==="GET"&&u.pathname==="/") return fetch(new URL("/index.html",request.url));
 if(request.method==="POST"&&u.pathname==="/api/start-payment"){
  const f=await request.formData(), amount=f.get("amount"), order=f.get("orderRefNum"), email=f.get("emailAddr"), mobile=f.get("mobileNum");
  if(!env.EASYPAY_STORE_ID||!env.FIRST_POSTBACK_URL||!env.FINAL_POSTBACK_URL)return new Response("Easypay configuration is incomplete.",{status:500});
  if(!amount||Number(amount)<=0||!order||!email||!mobile)return new Response("All fields are required.",{status:400});
  const fields={storeId:env.EASYPAY_STORE_ID,amount:Number(amount).toFixed(2),postBackURL:env.FIRST_POSTBACK_URL,orderRefNum:String(order),autoRedirect:"0",paymentMethod:"CC_PAYMENT_METHOD",emailAddr:String(email),mobileNum:String(mobile)};
  if(env.EASYPAY_MERCHANT_HASHED_REQ)fields.merchantHashedReq=env.EASYPAY_MERCHANT_HASHED_REQ;
  let inputs=""; for(const[k,v]of Object.entries(fields))inputs+=`<input type="hidden" name="${esc(k)}" value="${esc(v)}">`;
  return page(`<style>body{font-family:Arial;text-align:center;padding:40px}</style><p>Redirecting to Easypay...</p><form id="f" method="POST" action="${esc(env.EASYPAY_PG_URL)}">${inputs}</form><script>f.submit()</script>`);
 }
 if(request.method==="GET"&&u.pathname==="/easypay/token"){
  const token=u.searchParams.get("auth_token"); if(!token)return new Response("Missing auth_token.",{status:400});
  return page(`<style>body{font-family:Arial;text-align:center;padding:40px}</style><p>Confirming payment...</p><form id="f" method="POST" action="${esc(env.EASYPAY_CONFIRM_URL)}"><input type="hidden" name="auth_token" value="${esc(token)}"><input type="hidden" name="postBackURL" value="${esc(env.FINAL_POSTBACK_URL)}"></form><script>f.submit()</script>`);
 }
 if(request.method==="POST"&&u.pathname==="/easypay/result"){
  const f=await request.formData(),status=String(f.get("status")||""),desc=String(f.get("desc")||""),order=String(f.get("orderRefNumber")||f.get("orderRefNum")||""),ok=status.toLowerCase()==="success"&&desc==="0000";
  return page(`<style>body{font-family:Arial;text-align:center;padding:40px}.ok{color:#188038}.bad{color:#b00020}</style><h2 class="${ok?"ok":"bad"}">${ok?"Payment Successful":"Payment Failed"}</h2><p>Order: ${esc(order)}</p><p>Status: ${esc(status)}</p><p>Description: ${esc(desc)}</p>`);
 }
 return new Response("Not found",{status:404});
}};