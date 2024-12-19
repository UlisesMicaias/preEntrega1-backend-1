import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const productsFile = path.join('src', 'db', 'products.json');


async function ensureFileExists(filePath, initialData = []) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
    }
}

async function readFile(filePath) {
    await ensureFileExists(filePath);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
}

async function writeFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir el archivo:', error);
    };
};

router.get("/", async (req, res) => {
    const limit = parseInt(req.query.limit, 10);
    const products = await readFile(productsFile);
    res.json(limit ? products.slice(0, limit) : products);
});

router.post("/", async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;

    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ error: "Todos los campos son obligatorios excepto thumbnails" });
    }

    const products = await readFile(productsFile);
    const newProduct = {
        id: Date.now().toString(),
        title,
        description,
        code,
        price,
        stock,
        category,
        thumbnails: thumbnails || [],
        status: true,
    };

    products.push(newProduct); 
    await writeFile(productsFile, products); 
    res.status(201).json(newProduct); 
});


router.put("/:pid", async (req, res) => {
    const { pid } = req.params;
    const updates = req.body;
    const products = await readFile(productsFile);
    const productIndex = products.findIndex((p) => p.id === pid);

    if (productIndex === -1) return res.status(404).json({ error: "Producto no encontrado" });

    products[productIndex] = { ...products[productIndex], ...updates, id: pid };
    await writeFile(productsFile, products);
    res.json(products[productIndex]);
});

router.delete("/:pid", async (req, res) => {
    const { pid } = req.params;
    const products = await readFile(productsFile);
    const filteredProducts = products.filter((p) => p.id !== pid);

    if (filteredProducts.length === products.length) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    await writeFile(productsFile, filteredProducts);
    res.status(204).send();
});

export default router;
