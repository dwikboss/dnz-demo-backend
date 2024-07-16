// src/routes/users.ts
import { Router } from 'express';
import { SearchProducts } from '../controllers/mainController';

const router = Router();

router.post('/searchproducts', SearchProducts);


export default router;
