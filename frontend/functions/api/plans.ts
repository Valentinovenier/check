// frontend/functions/api/plans.ts
export async function onRequestGet(context: any) {
    const { env } = context;
    
    const proPrice = Number(env.PLAN_PRICE_PRO) || 9000;
    const basicPrice = Number(env.PLAN_PRICE_BASIC) || 4500;

    const formatCurrency = (val: number) => {
        return '$' + val.toLocaleString('es-AR');
    };

    return new Response(JSON.stringify({
        basic: {
            price: basicPrice,
            formatted: formatCurrency(basicPrice)
        },
        pro: {
            price: proPrice,
            formatted: formatCurrency(proPrice)
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
