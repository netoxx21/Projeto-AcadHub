require("dotenv").config();

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('X erro ao conectar ao PostgreSQL. Verificar o .env! Detalhe:',err.stack);
    }
    client.query('SELECT NOW()' , (err, result) => {
        release(); 

        if (err) {
            return console.error('Erro ao executar query de teste:' ,err.stack);
        }

        console.log(' Conexão com PostgreSQL estabelecida com sucesso!');
        console.log(result.rows[0].now);
    });
});

module.exports = {
    query: (text, params) => pool.query(text,params),
};

