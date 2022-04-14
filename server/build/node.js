"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNode = exports.node = void 0;
const lnrpc_1 = __importDefault(require("@radar/lnrpc"));
const env_1 = __importDefault(require("./env"));
function initNode() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.node = yield lnrpc_1.default({
            server: env_1.default.LND_GRPC_URL,
            cert: new Buffer(env_1.default.LND_TLS_CERT, 'base64').toString('ascii'),
            macaroon: new Buffer(env_1.default.LND_MACAROON, 'base64').toString('hex'),
        });
    });
}
exports.initNode = initNode;
