# GoPay Merchant Auto Payment

This integration lets israanwar.com use a self-hosted GoPay Merchant QRIS gateway.
The customer does not upload payment proof when the gateway is active; the order is
marked `paid` after the gateway detects the QRIS payment.

## Money destination

The money goes to the GoPay/QRIS merchant configured in the gateway, not to the
website code. For Okka Rhys, the gateway must be configured with the QRIS static
payload from:

- Merchant: `OKKA RHYS, DIGITAL & KREATIF`
- NMID: `ID1025456495932`
- Terminal label: `A01`

If `QRIS_STRING` or `QRIS_STATIC` belongs to another merchant, the money goes to
that merchant instead.

## QRIS amount prefill

The public payment page can also convert the saved static QRIS payload into a
per-order QRIS with the transaction amount embedded. This fixes wallet screens
that previously showed an empty `Amount` field after scanning the static QR.

This prefilled QRIS improves payment accuracy, but it does not confirm the order
automatically by itself. Automatic order status updates still require the GoPay
Merchant gateway, status endpoint, or webhook described below.

## Supported gateway adapters

`cv3inx` adapter, recommended for this repo:

- Gateway project: `https://github.com/cv3inx/gobiz-payment`
- Create endpoint: `POST /payment/create`
- Status endpoint: `GET /payment/:trxId`
- Webhook: supported with `X-Signature`

`zaki` adapter:

- Gateway project: `https://github.com/ahmadzakiyox/gopay-api-gateaway`
- Create endpoint: `POST /create-qris`
- Status endpoint: `GET /check-payment`
- Webhook: not required; israanwar checks status through Supabase Function

Both adapters are unofficial GoPay/GoBiz automation layers. Run them on a VPS or
cPanel Node.js app with persistent storage. Do not run them on sleeping/free
serverless containers because the GoBiz session file can disappear.

## Supabase secrets

Set these in Supabase, not in GitHub:

```bash
supabase secrets set GOPAY_GATEWAY_URL="https://gopay.your-domain.com"
supabase secrets set GOPAY_GATEWAY_API_KEY="replace-with-gateway-api-key"
supabase secrets set GOPAY_GATEWAY_ADAPTER="cv3inx"
supabase secrets set GOPAY_WEBHOOK_SECRET="replace-with-long-random-secret"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="replace-with-service-role-key"
```

For the `zaki` adapter, use:

```bash
supabase secrets set GOPAY_GATEWAY_ADAPTER="zaki"
```

## Functions

Deploy these functions:

```bash
supabase functions deploy gopay-create-payment
supabase functions deploy gopay-payment-status
supabase functions deploy gopay-webhook
```

The `cv3inx` gateway should use this webhook URL:

```text
https://<project-ref>.supabase.co/functions/v1/gopay-webhook
```

The create-payment function also passes that callback URL per transaction.

## Admin setting

In `/admin/settings`, enable:

```text
Aktifkan GoPay Merchant QRIS otomatis
```

Leave it disabled until the gateway health endpoint is stable and Supabase secrets
are set. When disabled, checkout keeps using the manual QRIS fallback.
