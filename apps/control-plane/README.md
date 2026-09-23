# Control Plane

NestJS entry point for WhatsApp Cloud API webhooks.

## Local setup

1. Copy the repository `.env.example` to `.env` and set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET`.
2. Run `pnpm dev:control-plane` from the repository root.
3. Expose port 3000 with `ngrok http 3000`.
4. In Meta, use `https://<ngrok-host>/webhooks/whatsapp` as the callback URL.
5. Use the exact `WHATSAPP_WEBHOOK_VERIFY_TOKEN` value as the Verify token.

Do not register a production phone number for this initial webhook test.
