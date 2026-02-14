import * as vscode from 'vscode';

import express from 'express';
import { createProxyMiddleware, RequestHandler, responseInterceptor } from 'http-proxy-middleware';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

import * as config from './config';
import * as files from './files';
import { SCRIPTS } from './constants';


export interface ServerContext {
    server: Server<typeof IncomingMessage, typeof ServerResponse>
    address: AddressInfo
    disposable: vscode.Disposable
    setTargetUrl(url: string): void
}

export function startServer(context: vscode.ExtensionContext): Promise<ServerContext> {
    return new Promise((resolve, reject) => {
        const app = express();

        let middleware: RequestHandler<IncomingMessage, ServerResponse<IncomingMessage>, (err?: any) => void>;
        let serverContext: ServerContext;
        setTargetUrl(config.getSudokuMakerUrl());

        function setTargetUrl(url: string) {
            middleware = createProxyMiddleware({
                target: url,
                changeOrigin: true,
                selfHandleResponse: true,
                on: {
                    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {

                        function transformFile(text: string): string {
                            let result = text;

                            result = result.replace(url.replace(/[//\/]+$/, ""), `http://localhost:${serverContext.address.port}`);
                            if (result.includes("decompressData")) {
                                console.log(result);
                                result = result.replace(/class\s(.{1,10})\{(.*?decompressData\()/, "class $1{static wwwww=(function(){window.DataDecompressor = $1})();$2");
                            }
                            return result;
                        }

                        if (res.getHeader("Content-Type")?.toString().includes("text/html")) {
                            const scriptFile = files.loadScript(context, SCRIPTS.sudokumaker.script);
                            const script = `
                            <script>
                                ${scriptFile}
                            </script>
                        `;
                            const headTag = "<head>";
                            const replacement = `${headTag}${script.trim()}`;
                            return transformFile(
                                responseBuffer
                                    .toString()
                                    .replace(headTag, replacement)
                            );
                        } else if (req.url?.endsWith(".js")) {
                            return transformFile(responseBuffer.toString());
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
                    serverContext = {
                        server,
                        address,
                        disposable: {
                            dispose: () => server.close()
                        },
                        setTargetUrl
                    };
                    resolve(serverContext);
                }
            } else {
                console.log("Error starting local WebServer:", e);
                reject(e);
            }
        });
    });
}