const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handleMessage(userDetails, userMessage, inventory) {
    const inventoryItems = inventory.map(item => `
        SKU: ${item["SKU"]}
        Onderdeeltitel: ${item["Onderdeeltitel"]}
        Onderdeel beschrijving: ${item["Onderdeel_beschrijving"]}
        Prijs: €${item["Prijs_per_stuk"]}
    `).join("\n");


    const prompt = `
        User firstname: ${userDetails[0]}
        User lastname: ${userDetails[1]}
        User email: ${userDetails[2]}
        User message: ${userMessage}
        
        Inventory:
        ${inventoryItems}

        Based on the users message, identify which product(s) they want to order, the quantity, and the total price.
        Respond in the following JSON format:
        
        {
            "first_name": "User firstname",
            "last_name": "User lastname",
            "email": "User email",
            "products": [
                {
                    "SKU": "1232BNMb",
                    "Onderdeeltitel": "Moer M12 - HexaLock 456",
                    "Onderdeel_beschrijving": "Moer voor een BMW X5 wielophanging",
                    "Stuks": "20",
                    "Totaalprijs": "60,00"
                },
                ...
            ]
        }.        
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            model: "gpt-4o",
            temperature: 0.5,
            response_format: { "type": "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        console.log(responseContent);
        return responseContent;
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to process message");
    }
}

// async function sendOrderEmail(userDetails, orderDetails) {
//     const mailOptions = {
//         from: process.env.SMTP_FROM,
//         to: userDetails[2],
//         subject: 'Uw bestelling bij De Nieuwe Zaak',
//         text: `Beste ${userDetails[0]} ${userDetails[1]},
        
//         Bedankt voor uw bestelling:

//         ${orderDetails.products.map(product => `
//             Product: ${product.Onderdeeltitel}
//             Beschrijving: ${product.Onderdeel_beschrijving}
//             Aantal: ${product.Stuks}
//             Totaalprijs: €${product.Totaalprijs}
//         `).join('\n')}
                
//         Met vriendelijke groet,
//         De Nieuwe Zaak`
//     };

//     // Send mail with defined transport object
//     await transporter.sendMail(mailOptions);
// }

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
