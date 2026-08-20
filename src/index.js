const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const html = (body) =>
  new Response(
    `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Easypay Payment</title>
</head>
<body>
${body}
</body>
</html>`,
    {
      headers: {
        "content-type": "text/html;charset=UTF-8"
      }
    }
  );

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
     * ================================
     * PAYMENT PAGE
     * ================================
     */
    if (request.method === "GET" && url.pathname === "/") {
      return env.ASSETS.fetch(request);
    }

    /*
     * ================================
     * START EASYPAY PAYMENT
     * ================================
     */
    if (
      request.method === "POST" &&
      url.pathname === "/api/start-payment"
    ) {
      const form = await request.formData();

      const amount = form.get("amount");
      const orderRefNum = form.get("orderRefNum");
      const emailAddr = form.get("emailAddr");
      const mobileNum = form.get("mobileNum");

      if (
        !env.EASYPAY_STORE_ID ||
        !env.FIRST_POSTBACK_URL ||
        !env.FINAL_POSTBACK_URL
      ) {
        return new Response(
          "Easypay configuration is incomplete. Configure the Worker variables first.",
          { status: 500 }
        );
      }

      if (
        !amount ||
        Number(amount) <= 0 ||
        !orderRefNum ||
        !emailAddr ||
        !mobileNum
      ) {
        return new Response(
          "Amount, Order ID, Email and Mobile Number are required.",
          { status: 400 }
        );
      }

      /*
       * Easypay 2D Card Payment
       */
      const fields = {
        storeId: env.EASYPAY_STORE_ID,

        amount: Number(amount).toFixed(2),

        postBackURL: env.FIRST_POSTBACK_URL,

        orderRefNum: String(orderRefNum),

        autoRedirect: "0",

        paymentMethod: "CC_PAYMENT_METHOD",

        emailAddr: String(emailAddr),

        mobileNum: String(mobileNum)
      };

      /*
       * Only use merchantHashedReq if Easypay
       * has specifically provided/configured it.
       */
      if (env.EASYPAY_MERCHANT_HASHED_REQ) {
        fields.merchantHashedReq =
          env.EASYPAY_MERCHANT_HASHED_REQ;
      }

      let inputs = "";

      for (const [key, value] of Object.entries(fields)) {
        inputs += `
<input
  type="hidden"
  name="${esc(key)}"
  value="${esc(value)}"
>`;
      }

      return html(`
<style>
body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px;
}
</style>

<h3>Redirecting to Easypay Secure Checkout...</h3>

<form
  id="easypayForm"
  method="POST"
  action="${esc(env.EASYPAY_PG_URL)}"
>
${inputs}
</form>

<script>
document.getElementById("easypayForm").submit();
</script>
`);
    }

    /*
     * ================================
     * EASYPAY AUTH TOKEN CALLBACK
     * ================================
     *
     * Easypay returns the authentication token
     * to this endpoint.
     */
    if (
      request.method === "GET" &&
      url.pathname === "/easypay/token"
    ) {
      const authToken =
        url.searchParams.get("auth_token");

      if (!authToken) {
        return new Response(
          "Missing Easypay auth_token.",
          { status: 400 }
        );
      }

      return html(`
<style>
body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 40px;
}
</style>

<h3>Confirming payment with Easypay...</h3>

<form
  id="confirmForm"
  method="POST"
  action="${esc(env.EASYPAY_CONFIRM_URL)}"
>

<input
  type="hidden"
  name="auth_token"
  value="${esc(authToken)}"
>

<input
  type="hidden"
  name="postBackURL"
  value="${esc(env.FINAL_POSTBACK_URL)}"
>

</form>

<script>
document.getElementById("confirmForm").submit();
</script>
`);
    }

    /*
     * ================================
     * FINAL PAYMENT RESULT
     * ================================
     */
    if (
      request.method === "POST" &&
      url.pathname === "/easypay/result"
    ) {
      const form = await request.formData();

      const status = String(
        form.get("status") || ""
      );

      const desc = String(
        form.get("desc") || ""
      );

      const orderRefNumber = String(
        form.get("orderRefNumber") ||
        form.get("orderRefNum") ||
        ""
      );

      /*
       * Easypay success condition
       */
      const paymentSuccessful =
        status.toLowerCase() === "success" &&
        desc === "0000";

      return html(`
<style>
body {
  font-family: Arial, sans-serif;
  background: #f4f7f9;
  padding: 30px;
  text-align: center;
}

.box {
  max-width: 430px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 18px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.12);
}

.success {
  color: #188038;
}

.failed {
  color: #b00020;
}

.info {
  margin-top: 20px;
  text-align: left;
  line-height: 1.8;
}
</style>

<div class="box">

<h2 class="${
        paymentSuccessful ? "success" : "failed"
      }">
${
        paymentSuccessful
          ? "Payment Successful"
          : "Payment Failed"
      }
</h2>

<div class="info">

<b>Order:</b>
${esc(orderRefNumber)}
<br>

<b>Status:</b>
${esc(status)}
<br>

<b>Description:</b>
${esc(desc)}

</div>

<p>
${
        paymentSuccessful
          ? "Easypay reported a successful transaction."
          : "The payment was not reported as successful."
      }
</p>

</div>
`);
    }

    /*
     * ================================
     * 404
     * ================================
     */
    return new Response(
      "Page not found.",
      { status: 404 }
    );
  }
};
