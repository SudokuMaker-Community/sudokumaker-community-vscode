import * as vscode from 'vscode';
import express from 'express';
import { createProxyMiddleware, RequestHandler, responseInterceptor } from 'http-proxy-middleware';
import * as fs from 'fs';
import path from 'node:path';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import * as config from './config';


export interface ServerContext {
    server: Server<typeof IncomingMessage, typeof ServerResponse>
    address: AddressInfo
    disposable: vscode.Disposable
    setTargetUrl(url: string): void
}

export function startServer(context: vscode.ExtensionContext): Promise<ServerContext> {
    return new Promise((resolve, reject) => {
        const app = express();

        const scriptPath = context.asAbsolutePath(path.join("scripts", "sudokumaker", "script.js"));

        let middleware: RequestHandler<IncomingMessage, ServerResponse<IncomingMessage>, (err?: any) => void>;
        setTargetUrl(config.getSudokuMakerUrl());

        function setTargetUrl(url: string) {
            middleware = createProxyMiddleware({
                target: url,
                changeOrigin: true,
                selfHandleResponse: true,
                on: {
                    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                        // TODO: Add cache headers (no caching)
                        if (res.getHeader("Content-Type")?.toString().includes("text/html")) {
                            const scriptFile = fs.readFileSync(scriptPath);
                            const script = `
                            <script>
                                ${scriptFile}
                            </script>
                        `;
                            const headTag = "<head>";
                            const replacement = `${headTag}${script.trim()}`;
                            return (
                                responseBuffer
                                    .toString()
                                    .replace(headTag, replacement)
                            );
                        } else {
                            return responseBuffer;
                        }
                    })
                }
            });
        }


        app.use('/', (req, res, next) => {
            return middleware(req, res, next);
        });

        const server = app.listen(0, (e) => {
            if (e === undefined) {

                const address = server.address();
                console.log("Address", address);
                if (!(typeof address === "object") || address === null) {
                    reject(new Error(`Error: Invalid Address (${address})`));
                } else {
                    console.log(`Proxy server running on http://localhost:${address.port}`);
                    resolve({
                        server,
                        address,
                        disposable: {
                            dispose: () => server.close()
                        },
                        setTargetUrl
                    });
                }
            } else {
                console.log("Error starting local WebServer:", e);
                reject(e);
            }
        });
    });
}