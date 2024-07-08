const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const nodemailer = require('nodemailer');
const axios = require("axios");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handleMessage(userDetails, userMessage, inventory) {
    const prompt = `I need keywords to use to lookup products in a large product inventory. From the user message, try to extract the product names and order amounts and put them in a JSON object. This is VERY IMPORTANT: create multiple variations of the keyword for a product. 
    For example, from: -Ik wil graag 3 MPC-Systeemrails van 40/60 SVZ van Mupro L=6000, ook zou ik graag de Messing plug M10 x 35 mm willen hebben.- You would return a JSON in the following format: {
    "product_1": {
        "keywords": {
            "keyword_variation_1": "MPC-Systeemrails 40/60 SVZ Mupro L=6000",
            "keyword_variation_2": "40/60 MPC-Systeemrails SVZ",
            "keyword_variation_3": "Mupro L=6000 MPC-Systeemrails 40/60 SVZ",
            "keyword_variation_4": "Mupro L=6000 40/60 SVZ MPC-Systeemrails",
            etc.
        },
        "amount": 3
    },
    "product_2":{
        "keywords": {
            "keyword_variation_1": "Messing plug M10 x 35 mm",
            "keyword_variation_2": "M10 x 35 mm Messing plug",
            "keyword_variation_3": "mm Messing plug M10 x 35",
            "keyword_variation_4": "mm Messing M10 x 35 plug",
            etc.
        },
        "amount": 1
    }. The products are ALWAYS singular. When someone uses plurals it highly likely means they want multiple orders of that product. This is the user message: ${userMessage}. ALWAYS make the keywords are singular and NOT plural! Match the EXACT JSON structure from my example where the keyword variations are inside an object with the amount outside of it! Make atleast 25 variations! Also create some variations where the brandname has been omitted like MPC-Systeemrails 40/60 SVZ L=6000 for example. Also OMIT regular words like 'voor', 'van', 'graag', or any articles from the keywords.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
        });

        const responseContent = completion.choices[0].message.content;
        console.log(responseContent);
        const orderDetails = JSON.parse(responseContent);
        return await lookupProducts(orderDetails);
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to process message");
    }
}

async function lookupProducts(orderDetails) {
    const productPromises = Object.keys(orderDetails).map(async productKey => {
        const product = orderDetails[productKey];
        const { keywords, amount } = product;
        let foundProduct = null;

        for (const variation of Object.values(keywords)) {
            console.log(variation);
            const url = `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_ID}/v3/catalog/products?keyword=${variation}&include_fields=name,description,price,sku`;

            try {
                const response = await axios.get(url, {
                    headers: {
                        'X-Auth-Token': process.env.BIGCOMMERCE_API_TOKEN,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                // console.log(response);

                if (response.data.data.length > 0) {
                    foundProduct = response.data.data.map(product => ({
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        sku: product.sku,
                        amount,
                    }));
                    break;
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }

        if (foundProduct) {
            return foundProduct;
        } else {
            throw new Error(`Failed to lookup product for keyword: ${Object.values(keywords).join(', ')}`);
        }
    });

    const allProducts = await Promise.all(productPromises);
    console.log(allProducts);
    return { order: { products: allProducts.flat() } };
}

app.post("/contact", async (req, res) => {
    const { firstName, lastName, email, message, inventory } = req.body;
    const user = [firstName, lastName, email];

    try {
        const messageReply = await handleMessage(user, message, inventory);
        res.json(messageReply);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
