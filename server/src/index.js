import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import alvarasRouter from './routes/alvaras.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/alvaras', alvarasRouter);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB');
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });
