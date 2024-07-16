import {OpenAI} from "openai";
import { CatalogProduct, ExtractedProduct } from "../middlewares/interfaces";


export async function ExtractProductsFromMessage(userMessage: string): Promise<ExtractedProduct[] | null> {
    // Initialize the OpenAI client
	const openai = new OpenAI();

    const JSONExample = {
        "products":[
            {
                "keywords": [
                    "SM24A\nBelimo luchtklepmotor 24V, 20Nm", "SM24A", "SM24A\nBelimo luchtklepmotor", "SM24A, 24V, 20Nm",
                ],
                "amount": 3
            },
            {
                "keywords": [
                    "SRSA 280", "SRSA 280 Afsluitende regelklep diameter 280mm", "Afsluitende regelklep diameter 280mm",
                ],
                "amount": 1
            }
        ]  
    };
    

    // Stuur een request naar OpenAI
    const response = await openai.chat.completions.create({
        messages: [{role: "system", content: `I need keywords to use to lookup products in a large product inventory. From the user message, try to extract the product names and order amounts and put them in a JSON object. This is VERY IMPORTANT: create multiple variations of the keyword for a product. 
    For example, from: -Ik wil graag 3 MPC-Systeemrails van 40/60 SVZ van Mupro L=6000, ook zou ik graag de Messing plug M10 x 35 mm willen hebben.- You would return a JSON in the following format: 
    ${JSON.stringify(JSONExample)}
    The products are ALWAYS singular. When someone uses plurals it highly likely means they want multiple orders of that product. ALWAYS make the keywords singular and NOT plural! Match the EXACT JSON structure from my example where the keyword variations are inside an object with the amount outside of it! Make atleast 15 variations! 
    ALWAYS create at least TWO variations where the brandname and product type have been omitted like "SM24A" instead of "SM24A Belimo luchtklepmotor" for example. Also OMIT regular words like 'voor', 'van', 'graag', or any articles from the keywords.
    Prefer variations that contain parts of the product name instead of different orderings of the words.`,}, 
    {role: "user", content: userMessage}],
        response_format: { type: "json_object" },
        model: "gpt-4o",
    });
    
    
    // Check of er een antwoord is
    if (!response?.choices?.length || !response.choices[0].message?.content) {
		return null;
	}

	const answer = JSON.parse(response.choices[0]?.message?.content);

    return answer.products;
}



export async function MatchProducts(userMessage: string, products: CatalogProduct[]): Promise<CatalogProduct | null> {
    // initialize the OpenAI client
    const openai = new OpenAI();

    const JSONExample = {
        sku: 0,
    }

    // Stuur een request naar OpenAI
    const response = await openai.chat.completions.create({
        messages: [{role: "system", content: `Determine which product matches the best with the request from the user message.
            PRODUCTS: ${JSON.stringify(products)}
            return the SKU value of the product that matches the best with the user message in the following JSON format:
            ${JSONExample}
            the JSON object has one field which is called 'sku'.`,}, 
        {role: "user", content: userMessage}],
        response_format: { type: "json_object" },
        model: "gpt-4o",
    });

    // Check of er een antwoord is
    if (!response?.choices?.length || !response.choices[0].message?.content) {
        return null;
    }

    const matchingSKU = JSON.parse(response.choices[0]?.message?.content);

    let bestMatch = null;
    for (const product of products) {
        if (product.sku === matchingSKU.sku) {
            bestMatch = product;
            break;
        }
    }


    return bestMatch;
}