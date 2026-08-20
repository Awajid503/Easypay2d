Easypay 2D Credit/Debit Card Plug-in starter.
Flow: first POST to Easypay Index.jsf -> customer checkout -> auth_token returned to FIRST_POSTBACK_URL -> merchant POSTs auth_token + FINAL_POSTBACK_URL to Confirm.jsf -> Easypay returns status, desc and order reference.
Credit/debit card method: CC_PAYMENT_METHOD.
Do not collect/store card number, CVV or PIN. Use HTTPS. Test in sandbox and complete Easypay live testing/approval before production. Do not guess a merchant hash formula; configure it only from Easypay-issued integration material.
