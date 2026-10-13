const express = require('express');
const app = express();

app.use(express.json());

const PORT = 4000;

//ejemplo de una peticion por medio de ruta principal get
app.get('/saludo', (req, res) => {
    res.json({ message: 'Hola esto es una prueba en get' });
});

app.post('/eco', (req, res) => {
    const { texto } = req.body;
    if (!texto) {
        return res.status(400).json({ error: 'el texto es obligatorio' });
    }
    res.status(201).json({ eco: texto });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto: ${PORT}`);
});
