import Base64 from "crypto-js/enc-base64";
import md5 from "crypto-js/md5";
import hmacSHA256 from "crypto-js/hmac-sha256";

const cgContentUrl = "/content/v2";
const cgBaseUrl = "https://cg.optimizely.com";
export const fetchData = <TData, TVariables>(
    query: string,
    variables?: TVariables,
    options?: RequestInit['headers']
): (() => Promise<TData>) => {
    return async () => {

        let isPreviewMode = process.env.NEXT_PUBLIC_CG_PREVIEW_MODE === "true" || false;
        let bodyString = JSON.stringify({
            query,
            variables
        });

        if(isPreviewMode){
            console.log(options);
            if(options === undefined) options = {};
            options["Authorization"] = generateHMACKey(
                process.env.NEXT_PUBLIC_CG_APP_KEY,
                process.env.NEXT_PUBLIC_CG_SECRET,
                bodyString
            );
        }

        const res = await fetch(`${cgBaseUrl}${cgContentUrl}?auth=${process.env.NEXT_PUBLIC_CG_SINGLE_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options
            },
            body: bodyString
        })

        const json = await res.json()
        if (json.errors) {
            const { message } = json.errors[0] || {}
            throw new Error(message || 'Error…')
        }

        return json.data
    }
}
function generateHMACKey (key, secretKey, body_str) {
    let secret = Base64.parse(secretKey);
    let method = "POST";
    let target = `${cgContentUrl}?auth=${process.env.NEXT_PUBLIC_CG_SINGLE_KEY}`;
    let timestamp = (new Date()).getTime();
    let nonce = Math.random().toString(36).substring(7);
    let body = "";
    body = body_str;
    let bodybase64 = Base64.stringify(md5(body));
    let message = key + method + target + timestamp + nonce + bodybase64;
    let hmac = hmacSHA256(message, secret);
    let base64hmac = Base64.stringify(hmac);
    return "epi-hmac " + key + ":" + timestamp +":" + nonce + ":" + base64hmac;
}
