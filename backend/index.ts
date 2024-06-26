const http = require('http');
const connection = require('./database/connection');
const bcrypt = require('bcrypt');
const jwtAuth = require('./jwt');

require('dotenv').config();


//Env variables and variables used for later
const port: number = parseInt(process.env.PORT || '3000', 10);
const host: string = process.env.HOST || 'localhost';
const saltRounds: number = 10;

//Mysql database connection
//Learned how we can create objects in typescript by specifying the object data types
type responseData = {
    data: string;
}

//The username, password, and message object type that is going to be used.
type userInfo = {
    username: string;
    password: string;
    message?: string;
}

//This is going to be used for the jwt signing and verification might add a refresh flag to determine if the jwt token has been refreshed or not
type payload = {
    username: string;
    message: string;
    //refresh: boolean;
}

const server = http.createServer(async(req: any, res: any) => {
    
    //Example of sending a http response from a post request
    let json :responseData = {
        data: `${req.url}`
    };
    //Mysql database connection. Since we are making this database in a node:http instead of express.js 
    //we need to make the connection inside of the http.createServer() method
    const connectToDB = await connection.dbConnection();
    /*
    const deleteUser = async()=>{
        const query = 'DELETE FROM `user` WHERE `username` = ? LIMIT 1';
        const values = [user.username];
        const [rows, fields] = await connectToDB.execute(query, values);
        res.writeHead(201, {'Content-Type':'text/plain'});
        res.write(`${user.username} has been deleted`);
        res.end();
    }
    deleteUser();
    */
    switch (req.url) {
        case '/':
            //For when an user needs to delete their account. Need to confirm if the password is valid or not with jwt
            if(req.method === 'DELETE'){
                const token = req.headers.authorization.split(" ")[1];
                const user = jwtAuth.jwtVerify(token);
                console.log(user);
                if(user == null){
                    res.writeHead(403, {'Content-Type':'text/plain'});
                    res.write("User does not exist");
                    res.end();
                }
                else{
                    //This query is how we update a column in a specific row into an empty string
                    const query = 'UPDATE `user` SET `message` = ? WHERE `username` = ?';
                    const values = ["", user.username.toString()];
                    const [rows, fields] = await connectToDB.execute(query, values);
                    console.log(rows);

                    res.writeHead(201, {'Content-Type':'application/json'});
                    res.write("User has been updated");
                    res.end();
                }
            }

            //This is going to be used to update the message
            if(req.method === 'PUT'){
                req.on('data', async(data: Buffer) => {
                    const token = req.headers.authorization.split(" ")[1];
                    const user = jwtAuth.jwtVerify(token);
                    console.log(user);
                    if(user == null){
                        res.writeHead(403, {'Content-Type':'text/plain'});
                        res.write("User does not exist");
                        res.end();
                    }
                    else{
                        let body = JSON.parse(data.toString());
                        //This query is how we update a column in a specific row
                        const query = 'UPDATE `user` SET `message` = ? WHERE `username` = ?';
                        const values = [body.message, user.username.toString()];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        console.log(rows);

                        res.writeHead(201, {'Content-Type':'application/json'});
                        res.write("User has been updated");
                        res.end();
                    }
                })

                
            }

            //Return the user message
            if(req.method === 'GET'){
                const token = req.headers.authorization.split(" ")[1];
                const user = jwtAuth.jwtVerify(token);
                if(user == null){
                    res.writeHead(403, {'Content-Type':'text/plain'});
                    res.write("User does not exist");
                    res.end();
                }
                else{
                    //We have to make an async function to the the message based on the username;
                    const getMessage = async()=>{
                        
                        const query = 'SELECT `message` FROM `user` WHERE `username` = ?';
                        const values = [user.username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        
                        res.writeHead(201, {'Content-Type':'application/json'});
                        res.write(JSON.stringify(rows[0]));
                        res.end();
                    }
                    getMessage();
                    
                }
                
            }
            break;

        case '/login':
            if(req.method === 'POST'){
                try {
                    let username:string = "";
                    let password:string = "";
                    let statusCode:number = 200;
                    let httpMessage:string = "";
                    let hashPassword:string = "";

                    req.on('data', async (data: Buffer) => {
                        
                        let body: userInfo = await JSON.parse(data.toString());
                        username = body.username;
                        password = body.password;
                        const query: string = 'SELECT * FROM `user` WHERE `Username` = ?';
                        const values = [username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        if (rows.length === 0) {
                            //We want to keep the error code for if the username is not found in the database
                            //and the password is invalid because we don't want to people to know whether the password is incorrect or the username
                            statusCode = 401;
                            httpMessage = "User not found";
                        } else {
                            hashPassword = rows[0].Password;
                            const isMatch: boolean = await bcrypt.compare(password, hashPassword);
                            //In Here we are going
                            if (isMatch) {
                                statusCode = 200;
                                const payload:payload = {username: body.username, message: rows[0].message}; 
                                httpMessage = JSON.stringify(jwtAuth.jwtSign(payload));
                                
                            } else {
                                statusCode = 401; // Unauthorized
                                httpMessage = "User not found";
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
                    let username:string;
                    let password:string;
                    let message:string;
                    //To access the body of a http request in node:http we need to use the req.on('data')
                    //Similar to how we did in the tcp server, but we don't have to parse the entire http message
                    req.on('data', async(data:any) => {
                        let body:userInfo = JSON.parse(data);
                        username= body.username;
                        password= body.password;
                        if(body.message === undefined){
                            message = "";
                        }
                        else{
                            message = body.message;
                        }

                        const userExists = 'SELECT `username` FROM `user` WHERE `username` = ?';
                        const value = [username];
                        const [result, fields] = await connectToDB.execute(userExists , value);
                        if(result[0].username.length != 0){
                            res.writeHead(405, {'Content-Type':'text/plain'});
                            res.write("Username already exists");
                            res.end();
                        }else{
                            const hash = await bcrypt.hash(password, saltRounds);
                            try {
                                //For the query just follow the same format as stated in the mysql2 docs
                                const query = 'INSERT INTO `user`(`username`, `password`, `message`) VALUES (?, ?, ?)';
                                const values = [username, hash, message];
                                const [result, fields] = await connectToDB.execute(query , values);
                                
                                res.writeHead(201, {'Content-Type':'text/plain'});
                                res.write("Successfully created the new user");
                                res.end();
                            } catch (error) {
                                res.writeHead(501, {'Content-Type':'text/plain'});
                                res.write("Server error in trying to sign a user up");
                                res.end();
                                console.error(error);
                            }
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


    
    
});

server.listen(port, () => console.log(`Server listening on port ${port}`));

