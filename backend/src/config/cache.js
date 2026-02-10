import NodeCache from 'node-cache';

const cache = new NodeCache({
    stdTTL: 600, // TTL padrão: 10 minutos
    checkperiod: 120, // Verificar itens expirados a cada 2 minutos
    useClones: false // Performance (não clona objetos)
});

export default cache;