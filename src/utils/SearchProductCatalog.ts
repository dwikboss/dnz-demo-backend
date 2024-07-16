import axios from "axios";
import { CatalogProduct, ExtractedProduct } from "../middlewares/interfaces";
import { MatchProducts } from "./OpenAI";



export async function SearchProductCatalog(searchTerms: ExtractedProduct[], userMessage: string): Promise<CatalogProduct[]> {

    const productList = [] as CatalogProduct[];
    for (const product of searchTerms) {
        console.log("Checking ", product.keywords.length, " keywords for product..");
        console.log(product.keywords)
        // Lijst voor alle matchende producten uit de catalog
        let foundProduct = [];
        for (const keyword of product.keywords) {
            // Maak een request naar de BigCommerce API
            const url = `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_ID}/v3/catalog/products?keyword=${keyword}&include_fields=name,description,price,sku`;

            const response = await axios.get(url, {
                headers: {
                    'X-Auth-Token': process.env.BIGCOMMERCE_API_TOKEN,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            // Als er producten zijn gevonden, voeg ze toe aan de lijst
            if (response.data.data.length > 0) {

                for (const catalogProduct of response.data.data) {
                foundProduct.push({name: catalogProduct.name, description: catalogProduct.description, price: catalogProduct.price, sku: catalogProduct.sku, amount: product.amount});
                }
            }
        }

        // Haal dubbele producten uit de lijst
        foundProduct = foundProduct.filter((product, index, self) =>
            index === self.findIndex((t) => (
                t.sku === product.sku
            )))


        // Kies het best matchende product, en voeg het toe aan de lijst
        console.log("Found ", foundProduct.length, " possible products.. Picking best match..");
        const bestMatch = await MatchProducts(userMessage, foundProduct);
        if (bestMatch !== null) {
            productList.push(bestMatch);
        }
    }
    return productList;
}