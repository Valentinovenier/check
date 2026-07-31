// frontend/functions/api/webhooks/mercadopago.ts
import { onRequestPost as mainWebhookHandler } from '../webhook-mercadopago';

export async function onRequestPost(context) {
    return mainWebhookHandler(context);
}

