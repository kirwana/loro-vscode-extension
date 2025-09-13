import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface HttpOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

export interface HttpResponse {
    ok: boolean;
    status: number;
    statusText: string;
    json: () => Promise<any>;
    text: () => Promise<string>;
}

export function httpRequest(url: string, options: HttpOptions = {}): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (options.body) {
            headers['Content-Length'] = Buffer.byteLength(options.body).toString();
        }

        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers
        };

        const req = client.request(requestOptions, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                const response: HttpResponse = {
                    ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
                    status: res.statusCode || 0,
                    statusText: res.statusMessage || '',
                    json: async () => {
                        if (!body || body.trim() === '') {
                            return null;
                        }
                        return JSON.parse(body);
                    },
                    text: async () => body
                };

                resolve(response);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}