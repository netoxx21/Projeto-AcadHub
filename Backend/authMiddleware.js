const jwt = require('jsonwebtoken');

// Middleware para verificar a validade do JWT
const protect = (req, res, next) => {
    
    let token = req.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso não autorizado. Token ausente ou mal formatado.' });
    }

    try {
        token = token.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; 
        
        next();

    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = { protect };