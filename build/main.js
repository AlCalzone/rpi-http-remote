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
                // TODO: Herunterfahren
                ret = "ok";
                contentType = "text/plain";
                enableCompression = false;
                writeResponse(ret);
                return;
            case "/reboot":
                // TODO: Reboot
                ret = "ok";
                contentType = "text/plain";
                enableCompression = false;
                writeResponse(ret);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJkOi9ycGktaHR0cC1yZW1vdGUvc3JjLyIsInNvdXJjZXMiOlsibWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsZ0JBQWdCO0FBQ2hCLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLDJCQUEyQjtBQUMzQiw2QkFBNkI7QUFFN0IseUNBQXFDO0FBRXJDLE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQztBQUMxQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXhDLHNDQUFzQztBQUN0QyxNQUFNLEtBQUssR0FBRztJQUNiLE9BQU8sRUFBRSxvQkFBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDaEMsSUFBSSxFQUFFLG9CQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUMxQixNQUFNLEVBQUUsb0JBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0NBQzlCLENBQUE7QUFFRCxvQ0FBb0M7QUFDcEMsTUFBTSxHQUFHLEdBQUc7SUFDWCxNQUFNLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQzVCLFFBQVEsRUFBRSxvQkFBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDaEMsU0FBUyxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQztJQUNsQyxNQUFNLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQzVCLE9BQU8sRUFBRSxvQkFBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7Q0FDOUIsQ0FBQTtBQUVELGlCQUFpQjtBQUNqQixJQUFJO0tBQ0MsWUFBWSxDQUFDLGNBQWMsQ0FBQztLQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUU5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