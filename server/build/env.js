"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env = {
    PORT: process.env.PORT,
    LND_GRPC_URL: process.env.LND_GRPC_URL,
    LND_MACAROON: process.env.LND_MACAROON,
    LND_TLS_CERT: process.env.LND_TLS_CERT,
};
// Ensure all keys exist
Object.entries(env).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Required environment variable '${key}' is missing!`);
    }
});
exports.default = env;
