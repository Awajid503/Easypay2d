# Easypay2d Cloudflare Worker
Cloudflare Workers version of the Easypay 2D credit/debit card plug-in starter.
Flow: payment form -> Easypay checkout -> auth_token callback -> Confirm.jsf -> final callback.
Payment method: CC_PAYMENT_METHOD.

Set Cloudflare variables/secrets:
EASYPAY_STORE_ID (secret)
FIRST_POSTBACK_URL (variable, your Worker URL + /easypay/token)
FINAL_POSTBACK_URL (variable, your Worker URL + /easypay/result)
EASYPAY_MERCHANT_HASHED_REQ (only if Easypay explicitly requires/issues it).
Do not put secrets in GitHub. Do not guess a hash formula. Test/sandbox and obtain live approval before real payments.
