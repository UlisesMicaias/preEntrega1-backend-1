import express from "express";
import fs from "fs/promises";
import path from "path";


const router = express.Router();

const cartsFile = path.join('src', 'db', 'carts.json');
const productsFile = path.join('src', 'db', 'products.json');


async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

async function writeFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}


router.post('/', async (req, res) => {
    const carts = await readFile(cartsFile);
    const newCart = { id: Date.now().toString(), products: [] };
    carts.push(newCart);
    await writeFile(cartsFile, carts);
    res.status(201).json(newCart);
});


router.get('/:cid', async (req, res) => {
    const { cid } = req.params.cid;
    const carts = await readFile(cartsFile);
    const cart = carts.find(c => c.id === cid);

    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });

    res.json(cart.products);
});


router.post('/:cid/product/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const carts = await readFile(cartsFile);
    const products = await readFile(productsFile);
    const cart = carts.find(c => c.id === cid);

    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    const productExists = products.some(p => p.id === pid);

    if (!productExists) return res.status(404).json({ error: 'Producto no encontrado' });

    const productInCart = cart.products.find(p => p.product === pid);

    if (productInCart) {
        productInCart.quantity += 1;
    } else {
        cart.products.push({ product: pid, quantity: 1 });
    }

    await writeFile(cartsFile, carts);
    res.status(200).json(cart);
});

export default router;
