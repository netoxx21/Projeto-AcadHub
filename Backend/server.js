require('dotenv').config(); 

const express = require('express');
const bcrypt = require('bcrypt'); 
const db = require('./db');     
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ pong: true, status: "Server OK" }); 
});

app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    // 1. Validação Simples (Obrigatória)
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
    }

    try {
        // 2. Criptografia da Senha (Segurança!)
        // O SaltRounds (10) define a complexidade da criptografia.
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // 3. Query SQL para Inserção (usando a tabela 'users' que criamos)
        const query = 'INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em';
        
        const values = [nome, email, senhaHash];
        
        // 4. Executar a Query no Banco de Dados
        const result = await db.query(query, values);
        const newUser = result.rows[0];

        // 5. Sucesso (Status 201: Created)
        res.status(201).json({ 
            message: 'Usuário cadastrado com sucesso!', 
            user: newUser
        });

    } catch (error) {
        // 6. Tratamento de Erro (Ex: Email já cadastrado)
        if (error.code === '23505' && error.constraint === 'users_email_key') {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }
        console.error('Erro ao cadastrar usuário:', error.stack);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});