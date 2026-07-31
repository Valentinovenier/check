// frontend/functions/api/webhook/mercadopago.ts
import { onRequestPost as handlePost, onRequestGet as handleGet } from '../webhook-mercadopago';

export async function onRequestPost(context: any) {
    return handlePost(context);
}

export async function onRequestGet(context: any) {
    return handleGet(context);
}
