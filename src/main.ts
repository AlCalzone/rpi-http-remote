// Importe laden
import * as zlib from "zlib";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import * as http from "http";
import {exec} from "child_process";

import {promisify} from "./promises";

const port: number = 8081;
const appRoot = path.resolve(__dirname, "..");

// zlib-Funktionen in Promises kapseln
const _zlib = {
	deflate: promisify(zlib.deflate),
	gzip: promisify(zlib.gzip),
	gunzip: promisify(zlib.gunzip)
}

// FS-Funktionen in Promises kapseln
const _fs = {
	exists: promisify(fs.exists),
	readFile: promisify(fs.readFile),
	writeFile: promisify(fs.writeFile),
	unlink: promisify(fs.unlink),
	readdir: promisify(fs.readdir)
}

// Server starten
http
    .createServer(handleResponse)
    .listen(port);
console.log(`Server running on port ${port}`);

async function handleResponse(req, resp) {
    
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
    let enableCompression = true // globale Einstellung
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
    async function writeResponse(body, additionalHeaders?: any) {

        // Cross-Domain-Requests erlauben
        const headers = { 
            "Content-Type": `${contentType}; charset=utf-8`,
            "Access-Control-Allow-Origin": "*"
            }
        // Zusätzliche Header ergänzen (z.B. Cache)
        if (additionalHeaders) Object.assign(headers, additionalHeaders);
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
                    compressed = await _zlib.gzip(buffer);
                else if (supportsDeflate)
                    compressed = await _zlib.deflate(buffer);
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

    }

    console.log(`handling request for ${req.url}`);
    let p;
    switch (p = urlParts.pathname) {
        case "/shutdown":
            contentType = "text/plain";
            enableCompression = false;
            exec("shutdown -h now", (err, stdout, stderr) => {
                if (err) {
                    ret = "Error: " + err;
                } else {
                    ret = "ok";
                }
                writeResponse(ret);
            });
            return;
        case "/reboot":
            contentType = "text/plain";
            enableCompression = false;
            exec("reboot", (err, stdout, stderr) => {
                if (err) {
                    ret = "Error: " + err;
                } else {
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
        const content = await _fs.readFile(filename, "utf-8");

        let addHeaders = {};
        if (leverageCache) {
            // Zeitpunkt des letzten Zugriffs ermitteln
            const lastModified = fs
                .statSync(filename)
                .mtime
                .toUTCString()
                ;
            addHeaders = {
                "Cache-Control": "public, max-age=31536000",
                "Last-Modified": lastModified
            };
        }
        await writeResponse(content, addHeaders);

    } catch (e) {
        resp.writeHead(500, {
            "Access-Control-Allow-Origin": "*"
        });
        resp.end(`An error (${e}) occured while looking for the file \"${filename}\" \n`);
    }
} // end function handleResponse