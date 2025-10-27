require('dotenv').config(); 

const express = require('express');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const db = require('./db');
const { protect } = require('./authMiddleware');     
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ pong: true, status: "Server OK" }); 
});

app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
    }

    try {
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // 3. Query SQL para Inserção (usando a tabela 'users' que criamos)
        const query = 'INSERT INTO users (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em';
        
        const values = [nome, email, senhaHash];
        
        const result = await db.query(query, values);
        const newUser = result.rows[0];

        res.status(201).json({ 
            message: 'Usuário cadastrado com sucesso!', 
            user: newUser
        });

    } catch (error) {

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

// Rota de login 

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const userQuery = 'SELECT id, nome, email, senha_hash FROM users WHERE email = $1';
        const result = await db.query(userQuery, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const match = await bcrypt.compare(senha, user.senha_hash);

        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        
        const payload = {
            id: user.id,
            email: user.email
        };
        
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erro durante o login:', error.stack);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ---------------------------------------- Rota Protegida de Teste (/api/user/profile)
// Requer um JWT válido no cabeçalho Authorization


app.get('/api/user/profile', protect, (req, res) => {
    // Se o código chegar aqui, o token é válido!
    res.json({
        message: 'Acesso concedido a rota protegida!',
        user_id_logado: req.user.id, // Acessando os dados injetados pelo Middleware
        email_logado: req.user.email
    });
});