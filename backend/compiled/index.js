"use strict";
const http = require('http');
const port = 3000;
const host = "localhost";
const server = http.createServer((req, res) => {
    //console.log(req.url + ": "+ req.method);
    //Example of sending a http response from a post request
    let json = {
        data: 'Hellow'
    };
    if (req.method == 'POST') {
        console.log('Post request');
        //Makes the header based on whatever Content-Type that we want, but
        //Since we are sending a json data we use application/json
        res.writeHead(200, { 'Content-Type': 'application/json' });
        //res.end just specifies what we are sending to the body
        res.end(JSON.stringify({
            data: json.data,
        }));
    }
    else {
        res.end('Hello world');
    }
});
server.listen(port, () => console.log(`Server listening on port ${port}`));
