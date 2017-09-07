"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importe laden
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const url = require("url");
const http = require("http");
const child_process_1 = require("child_process");
const promises_1 = require("./promises");
const port = 8081;
const appRoot = path.resolve(__dirname);
// zlib-Funktionen in Promises kapseln
const _zlib = {
    deflate: promises_1.promisify(zlib.deflate),
    gzip: promises_1.promisify(zlib.gzip),
    gunzip: promises_1.promisify(zlib.gunzip)
};
// FS-Funktionen in Promises kapseln
const _fs = {
    exists: promises_1.promisify(fs.exists),
    readFile: promises_1.promisify(fs.readFile),
    writeFile: promises_1.promisify(fs.writeFile),
    unlink: promises_1.promisify(fs.unlink),
    readdir: promises_1.promisify(fs.readdir)
};
// Server starten
http
    .createServer(handleResponse)
    .listen(port);
console.log(`Server running on port ${port}`);
function handleResponse(req, resp) {
    return __awaiter(this, void 0, void 0, function* () {
        // zu Log-Zwecken
        let now = 0;
        // URL der Anfrage ermitteln, wird aufgeteilt in href, search (?=...), query ({k:v,...}) und pathname
        const urlParts = url.parse(req.url, true);
        // Parameter der Antwort
        let statusCode = 200;
        let contentType = "text/html";
        let leverageCache = true;
        // Auszugebende Datei/String
        let outputFile, ret;
        outputFile = "index.html";
        ret = "";
        // Möglicherweise Komprimierung aktivieren
        let acceptEncoding = req.headers["accept-encoding"] || "";
        let enableCompression = true; // globale Einstellung
        // -> Abhängig von Browser- Support
        const supportsGzip = acceptEncoding.match(/\bgzip\b/);
        const supportsDeflate = acceptEncoding.match(/\bdeflate\b/);
        enableCompression = enableCompression && (supportsGzip || supportsDeflate);
        // -> Abhängig von Größe
        const minSizeForCompression = 1024; // 1 kB
        // Wird bei nicht vorhandenen Dateien aufgerufen
        function notFound() {
            statusCode = 404;
            outputFile = "404.html";
        }
        // Wird aufgerufen, wenn die Ausgabe geschrieben werden soll
        function writeResponse(body, additionalHeaders) {
            return __awaiter(this, void 0, void 0, function* () {
                // Cross-Domain-Requests erlauben
                const headers = {
                    "Content-Type": `${contentType}; charset=utf-8`,
                    "Access-Control-Allow-Origin": "*"
                };
                // Zusätzliche Header ergänzen (z.B. Cache)
                if (additionalHeaders)
                    Object.assign(headers, additionalHeaders);
                // Compression-Header setzen
                if (enableCompression) {
                    if (supportsGzip)
                        headers["Content-Encoding"] = "gzip";
                    else if (supportsDeflate)
                        headers["Content-Encoding"] = "deflate";
                }
                // Header schreiben
                resp.writeHead(statusCode, headers);
                // Wenn der body ein Buffer ist, direkt in die Ausgabe schreiben. 
                // Dieser ist per Konvention bereits komprimiert
                if (body instanceof Buffer) {
                    console.log("serving Buffer (already compressed)");
                    resp.write(body);
                    resp.end();
                }
                else {
                    if (enableCompression) {
                        console.log("serving string content (compressed)");
                        const now = Date.now();
                        // Inhalt komprimieren
                        const buffer = new Buffer(body, 'utf8');
                        let compressed;
                        if (supportsGzip)
                            compressed = yield _zlib.gzip(buffer);
                        else if (supportsDeflate)
                            compressed = yield _zlib.deflate(buffer);
                        // und in die Ausgabe schreiben
                        resp.write(compressed);
                        resp.end();
                    }
                    else {
                        // sonst Rohdaten senden
                        console.log("serving string content (uncompressed)");
                        resp.end(body, 'utf8');
                    }
                }
            });
        }
        console.log(`handling request for ${req.url}`);
        let p;
        switch (p = urlParts.pathname) {
            case "/shutdown":
                contentType = "text/plain";
                enableCompression = false;
                child_process_1.exec("shutdown -h now", (err, stdout, stderr) => {
                    if (err) {
                        ret = "Error: " + err;
                    }
                    else {
                        ret = "ok";
                    }
                    writeResponse(ret);
                });
                return;
            case "/reboot":
                contentType = "text/plain";
                enableCompression = false;
                child_process_1.exec("reboot", (err, stdout, stderr) => {
                    if (err) {
                        ret = "Error: " + err;
                    }
                    else {
                        ret = "ok";
                    }
                    writeResponse(ret);
                });
                return;
            case "/":
                // Alles voreingestellt
                break;
            default:
                leverageCache = false;
                // Default: 404
                notFound();
        } // end switch
        // Wenn kein API-Aufruf abgehandelt wird, dann versuchen, die angeforderte Datei auszugeben
        const filename = path.join(appRoot, outputFile);
        console.log(`trying to output file ${filename}`);
        try {
            const content = yield _fs.readFile(filename, "utf-8");
            let addHeaders = {};
            if (leverageCache) {
                // Zeitpunkt des letzten Zugriffs ermitteln
                const lastModified = fs
                    .statSync(filename)
                    .mtime
                    .toUTCString();
                addHeaders = {
                    "Cache-Control": "public, max-age=31536000",
                    "Last-Modified": lastModified
                };
            }
            yield writeResponse(content, addHeaders);
        }
        catch (e) {
            resp.writeHead(500, {
                "Access-Control-Allow-Origin": "*"
            });
            resp.end(`An error (${e}) occured while looking for the file \"${filename}\" \n`);
        }
    });
} // end function handleResponse
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJkOi9ycGktaHR0cC1yZW1vdGUvc3JjLyIsInNvdXJjZXMiOlsibWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsZ0JBQWdCO0FBQ2hCLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLDJCQUEyQjtBQUMzQiw2QkFBNkI7QUFDN0IsaURBQW1DO0FBRW5DLHlDQUFxQztBQUVyQyxNQUFNLElBQUksR0FBVyxJQUFJLENBQUM7QUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV4QyxzQ0FBc0M7QUFDdEMsTUFBTSxLQUFLLEdBQUc7SUFDYixPQUFPLEVBQUUsb0JBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ2hDLElBQUksRUFBRSxvQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDMUIsTUFBTSxFQUFFLG9CQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztDQUM5QixDQUFBO0FBRUQsb0NBQW9DO0FBQ3BDLE1BQU0sR0FBRyxHQUFHO0lBQ1gsTUFBTSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUM1QixRQUFRLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ2hDLFNBQVMsRUFBRSxvQkFBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUM7SUFDbEMsTUFBTSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0NBQzlCLENBQUE7QUFFRCxpQkFBaUI7QUFDakIsSUFBSTtLQUNDLFlBQVksQ0FBQyxjQUFjLENBQUM7S0FDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLElBQUksRUFBRSxD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