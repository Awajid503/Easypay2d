const express=require("express"),path=require("path");
const app=express();app.use(express.urlencoded({extended:false}));app.use(express.static(path.join(__dirname,"public")));
const PORT=process.env.PORT||3000,STORE=process.env.EASYPAY_STORE_ID;
const PG=process.env.EASYPAY_PG_URL||"https://easypay.easypaisa.com.pk/easypay/Index.jsf";
const CONFIRM=process.env.EASYPAY_CONFIRM_URL||"https://easypay.easypaisa.com.pk/easypay/Confirm.jsf";
const FIRST=process.env.FIRST_POSTBACK_URL,FINAL=process.env.FINAL_POSTBACK_URL,HASH=process.env.EASYPAY_MERCHANT_HASHED_REQ||"";
function e(x){return String(x??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");}
app.post("/api/start-payment",(q,s)=>{
 const {amount,orderRefNum,emailAddr,mobileNum}=q.body;
 if(!STORE||!FIRST||!FINAL)return s.status(500).send("Configure Store ID and HTTPS callback URLs.");
 if(!amount||Number(amount)<=0||!orderRefNum||!emailAddr||!mobileNum)return s.status(400).send("All fields are required.");
 const f={storeId:STORE,amount:Number(amount).toFixed(2),postBackURL:FIRST,orderRefNum,autoRedirect:"0",paymentMethod:"CC_PAYMENT_METHOD",emailAddr,mobileNum};
 if(HASH)f.merchantHashedReq=HASH;
 let h=`<body onload="document.getElementById('f').submit()"><p>Redirecting to Easypay...</p><form id="f" method="POST" action="${e(PG)}">`;
 for(const[k,v]of Object.entries(f))h+=`<input type="hidden" name="${e(k)}" value="${e(v)}">`;
 s.send(h+"</form></body>");
});
app.get("/easypay/token",(q,s)=>{
 if(!q.query.auth_token)return s.status(400).send("Missing auth_token.");
 s.send(`<body onload="document.getElementById('f').submit()"><p>Confirming payment...</p><form id="f" method="POST" action="${e(CONFIRM)}"><input type="hidden" name="auth_token" value="${e(q.query.auth_token)}"><input type="hidden" name="postBackURL" value="${e(FINAL)}"></form></body>`);
});
app.post("/easypay/result",(q,s)=>{
 const ok=String(q.body.status).toLowerCase()==="success"&&String(q.body.desc)==="0000";
 s.send(`<meta name="viewport" content="width=device-width"><div style="font-family:Arial;text-align:center;padding:40px"><h2>${ok?"Payment Successful":"Payment Failed"}</h2><p>Order: ${e(q.body.orderRefNumber||q.body.orderRefNum||"")}</p><p>Status: ${e(q.body.status||"")}</p><p>Description: ${e(q.body.desc||"")}</p></div>`);
});
app.listen(PORT,()=>console.log("Server on "+PORT));