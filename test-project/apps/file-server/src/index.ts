import express, { Request, Response } from 'express';
import { registerR2, startFileServer } from '@bbuild/files';
import { registerRpcCalls } from '@bbuild/files/rpc/ws';

const app = express();
const port = process.env.PORT ?? 2549;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    // Allow preflight requests
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
        return res.status(200).json({})
    }
    next()
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

startFileServer()
registerR2()
registerRpcCalls()

