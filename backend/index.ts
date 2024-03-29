const http = require('http');
const port: number = 3000;
const host: string = "localhost";

const server = http.createServer((req: any, res: any) => {
    console.log(req.url, req.method);
});

server.listen(port, () => console.log(`Server listening on port ${port}`));