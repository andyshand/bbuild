/**
 * Because this is designed to be used alongside nextjs in a single deployment,
 * use port 3000 (nextjs default). Requests will be proxied via custom nextjs server when matching /ws/*
 */
export const RPC_DEFAULT_PORT = 3000
export const RPC_DEFAULT_PORT_REAL = 8080
export const RPC_DEFAULT_HOST = 'localhost'
