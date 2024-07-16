// src/controllers/userController.ts
import { Request, Response } from 'express';
import { ExtractProductsFromMessage } from '../utils/OpenAI';
import { SearchProductCatalog } from '../utils/SearchProductCatalog';

export const SearchProducts = async (req: any, res: Response) => {
    const { userMessage } = req.body;
    
    // Haal zoektermen uit het bericht
    const searchTerms = await ExtractProductsFromMessage(userMessage);
    
    
    if (searchTerms){
        console.log("Succesfully extracted keywords for " + searchTerms.length + " products from the user message");
        // Als er zoektermen zijn, zoek in de catalogus
        const productList = await SearchProductCatalog(searchTerms, userMessage);

        if (productList.length > 0){
            console.log("Returning order with ", productList.length, " products..");
            // Als er producten zijn gevonden, stuur ze terug
            res.status(200).send({products: productList});
        } else {
            // Als er geen producten zijn gevonden, stuur een foutmelding terug
            res.status(404).send('No products found..');
        }

    } else{
        // Als er geen zoektermen zijn gevonden, stuur een foutmelding terug
        res.status(400).send('Unable to get response');
    }
}





