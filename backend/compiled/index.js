"use strict";
const http = require('http');
const port = 3000;
const host = "localhost";
const server = http.createServer((req, res) => {
    console.log(req.url, req.method);
});
server.listen(port, () => console.log(`Server listening on port ${port}`));
