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
const port = 9876;
const appRoot = path.resolve(__dirname, "../");
console.log("appRoot = " + appRoot);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJDOi9Vc2Vycy9Eb21pbmljL0RvY3VtZW50cy9WaXN1YWwgU3R1ZGlvIDIwMTcvUmVwb3NpdG9yaWVzL3JwaS1odHRwLXJlbW90ZS9zcmMvIiwic291cmNlcyI6WyJtYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxnQkFBZ0I7QUFDaEIsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0IsMkJBQTJCO0FBQzNCLDZCQUE2QjtBQUM3QixpREFBbUM7QUFFbkMseUNBQXFDO0FBRXJDLE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQztBQUMxQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsQ0FBQztBQUVwQyxzQ0FBc0M7QUFDdEMsTUFBTSxLQUFLLEdBQUc7SUFDYixPQUFPLEVBQUUsb0JBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ2hDLElBQUksRUFBRSxvQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDMUIsTUFBTSxFQUFFLG9CQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztDQUM5QixDQUFBO0FBRUQsb0NBQW9DO0FBQ3BDLE1BQU0sR0FBRyxHQUFHO0lBQ1gsTUFBTSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUM1QixRQUFRLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDO0lBQ2hDLFNBQVMsRUFBRSxvQkFBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUM7SUFDbEMsTUFBTSxFQUFFLG9CQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLEVBQUUsb0JBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0NBQzlCLENBQUE7QUFFRCxp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