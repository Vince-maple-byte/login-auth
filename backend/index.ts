const http = require('http');
const connection = require('./database/connection');
const bcrypt = require('bcrypt');
require('dotenv').config();


//Env variables and variables used for later
const port: number = parseInt(process.env.PORT || '3000', 10);
const host: string = process.env.HOST || 'localhost';
const saltRounds: number = 10;

//Mysql database connection
console.log(process.env.DB_USER);
//Learned how we can create objects in typescript by specifying the object data types
type responseData = {
    data: string;
}

type signUp = {
    username: string;
    password: string;
    message: string;
}

type loginIn = {
    username: string;
    password: string;
}

const server = http.createServer(async(req: any, res: any) => {
    //console.log(req.url + ": "+ req.method);
    //Example of sending a http response from a post request
    let json :responseData = {
        data: `${req.url}`
    };
    //Mysql database connection. Since we are making this database in a node:http instead of express.js 
    //we need to make the connection inside of the http.createServer() method
    const connectToDB = await connection.dbConnection();

    switch (req.url) {
        case '/':
            //For when an user needs to delete their account. Need to confirm if the password is valid or not with jwt
            if(req.method === 'DELETE'){

            }

            //For when an user wants to update there password or the message. Need to confirm if the password is valid or not with jwt
            if(req.method === 'PUT'){

            }

            //Return the user message
            if(req.method === 'GET'){

            }
            
            res.writeHead(200, {'Content-Type':'text/plain'});
            res.write("Welcome to login practice go to the url paths /login and /signup");
            res.end();
            break;

        case '/login':
            if(req.method === 'POST'){
                try {
                    let username:string = "";
                    let password:string = "";
                    let statusCode:number = 200;
                    let httpMessage:string = "";
                    let hashPassword:string = "";

                    req.on('data', async (data: any) => {
                        let body: loginIn = await JSON.parse(data);
                        console.log(body);
                        username = body.username;
                        password = body.password;
                        const query: string = 'SELECT * FROM `user` WHERE `Username` = ?';
                        const values = [username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        if (rows.length === 0) {
                            statusCode = 404;
                            httpMessage = "User not found";
                        } else {
                            hashPassword = rows[0].Password;
                            console.log("Retrieved Hash:", hashPassword);
                            console.log(hashPassword.length);
                            console.log(password.charCodeAt(0))
                            const isMatch: boolean = await bcrypt.compare(password, hashPassword);
                            console.log("Password Match:", isMatch);
                            if (isMatch) {
                                statusCode = 200;
                                httpMessage = "Valid user: " + rows[0].message;
                            } else {
                                statusCode = 401; // Unauthorized
                                httpMessage = "Invalid password";
                            }
                        }
                        res.writeHead(statusCode, {'Content-Type':'text/plain'});
                        res.write(httpMessage);
                        res.end();
                    });
                } catch (error) {
                    console.log(error);
                }
            }
            break;
        case '/signup':
            if(req.method === 'POST'){
                try {
                    let username:string = "";
                    let password:string = "";
                    let message:string = "";
                    //To access the body of a http request in node:http we need to use the req.on('data')
                    //Similar to how we did in the tcp server, but we don't have to parse the entire http message
                    req.on('data', async(data:any) => {
                        let body:signUp = JSON.parse(data);
                        console.log(body);
                        username= body.username;
                        password= body.password;
                        message = body.message;
                        const hash = await bcrypt.hash(password, saltRounds);
                        try {
                            //For the query just follow the same format as stated in the mysql2 docs
                            const query = 'INSERT INTO `user`(`username`, `password`, `message`) VALUES (?, ?, ?)';
                            const values = [username, hash, message];
                            console.log(username+ ", " + password + ", " + ", " + message)
                            const [result, fields] = await connectToDB.execute(query , values);
                            
                            res.writeHead(201, {'Content-Type':'text/plain'});
                            res.write("Successfully created the new user");
                            res.end();
                        } catch (error) {
                            res.writeHead(501, {'Content-Type':'text/plain'});
                            res.write("Server error in trying to sign a user up");
                            res.end();
                            console.error(error + "\n Ericdoa");
                        }
                    });
                } catch (error) {
                    res.writeHead(401, {'Content-Type':'text/plain'});
                    res.write("Server error in trying to sign a user up");
                    res.end();
                    console.log(error);
                }
                
            }
            break;
    
        default:
            res.writeHead(404, {'Content-Type':'text/plain'});
            res.write("Incorrect path");
            res.end();
            break;
    }
    
    // switch (req.method) {
    //     case 'POST':
    //         console.log('Post request ' + req.url);
    //         //We need to make an if statement checking if the location is in the 
    //         //login page or the sign up page

    //         // if(req.url){

    //         // }

            
    //         //Makes the header based on whatever Content-Type that we want, but
    //         //Since we are sending a json data we use application/json
    //         res.writeHead(200, {'Content-Type':'application/json'});
    //         //res.end just specifies what we are sending to the body
    //         res.end(JSON.stringify({
    //             data: json.data,
    //         }));
            
    //         break;
    //     case 'GET':
    //         if(req.url == '/login'){
    //             console.log('We are in the login page');
                
    //         }
    //         else{
    //             //console.log("This is not a post request");
    //             res.writeHead(200, {'Content-Type':'text/plain'});
    //             res.write("Welcome to this server");
    //             res.end();
    //         }
    //         break;
        
    //     case 'PUT':
    //         break;
        
    //     case 'DELETE':
    //         break;
    
    //     default:

    //         break;
    //}

    
    
});

server.listen(port, () => console.log(`Server listening on port ${port}`));

