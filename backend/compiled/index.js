"use strict";
const http = require('http');
const connection = require('./database/connection');
const bcrypt = require('bcrypt');
const jwtAuth = require('./jwt');
require('dotenv').config();
//Env variables and variables used for later
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || 'localhost';
const saltRounds = 10;
const server = http.createServer(async (req, res) => {
    //Example of sending a http response from a post request
    let json = {
        data: `${req.url}`
    };
    //Mysql database connection. Since we are making this database in a node:http instead of express.js 
    //we need to make the connection inside of the http.createServer() method
    const connectToDB = await connection.dbConnection();
    switch (req.url) {
        case '/':
            //For when an user needs to delete their account. Need to confirm if the password is valid or not with jwt
            if (req.method === 'DELETE') {
                const token = req.headers.authorization.split(" ")[1];
                const user = jwtAuth.jwtVerify(token);
                if (user == null) {
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    res.write("User does not exist");
                    res.end();
                }
                else {
                    const deleteUser = async () => {
                        const query = 'DELETE FROM `user` WHERE `username` = ? LIMIT 1';
                        const values = [user.username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        res.writeHead(201, { 'Content-Type': 'text/plain' });
                        res.write(`${user.username} has been deleted`);
                        res.end();
                    };
                    deleteUser();
                }
            }
            //This is going to be used to update the message
            if (req.method === 'PUT') {
                req.on('data', async (data) => {
                    const token = req.headers.authorization.split(" ")[1];
                    const user = jwtAuth.jwtVerify(token);
                    console.log(user);
                    if (user == null) {
                        res.writeHead(403, { 'Content-Type': 'text/plain' });
                        res.write("User does not exist");
                        res.end();
                    }
                    else {
                        let body = JSON.parse(data.toString());
                        const query = 'UPDATE `user` SET `message` = ? WHERE `username` = ?';
                        const values = [body.message, user.username.toString()];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        console.log(rows);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.write("User has been updated");
                        res.end();
                    }
                });
            }
            //Return the user message
            if (req.method === 'GET') {
                const token = req.headers.authorization.split(" ")[1];
                const user = jwtAuth.jwtVerify(token);
                if (user == null) {
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    res.write("User does not exist");
                    res.end();
                }
                else {
                    //We have to make an async function to the the message based on the username;
                    const getMessage = async () => {
                        const query = 'SELECT `message` FROM `user` WHERE `username` = ?';
                        const values = [user.username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify(rows[0]));
                        res.end();
                    };
                    getMessage();
                }
            }
            break;
        case '/login':
            if (req.method === 'POST') {
                try {
                    let username = "";
                    let password = "";
                    let statusCode = 200;
                    let httpMessage = "";
                    let hashPassword = "";
                    req.on('data', async (data) => {
                        let body = await JSON.parse(data.toString());
                        username = body.username;
                        password = body.password;
                        const query = 'SELECT * FROM `user` WHERE `Username` = ?';
                        const values = [username];
                        const [rows, fields] = await connectToDB.execute(query, values);
                        if (rows.length === 0) {
                            //We want to keep the error code for if the username is not found in the database
                            //and the password is invalid because we don't want to people to know whether the password is incorrect or the username
                            statusCode = 401;
                            httpMessage = "User not found";
                        }
                        else {
                            hashPassword = rows[0].Password;
                            const isMatch = await bcrypt.compare(password, hashPassword);
                            //In Here we are going
                            if (isMatch) {
                                statusCode = 200;
                                const payload = { username: body.username, message: rows[0].message };
                                httpMessage = JSON.stringify(jwtAuth.jwtSign(payload));
                            }
                            else {
                                statusCode = 401; // Unauthorized
                                httpMessage = "User not found";
                            }
                        }
                        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
                        res.write(httpMessage);
                        res.end();
                    });
                }
                catch (error) {
                    console.log(error);
                }
            }
            break;
        case '/signup':
            if (req.method === 'POST') {
                try {
                    let username;
                    let password;
                    let message;
                    //To access the body of a http request in node:http we need to use the req.on('data')
                    //Similar to how we did in the tcp server, but we don't have to parse the entire http message
                    req.on('data', async (data) => {
                        let body = JSON.parse(data);
                        username = body.username;
                        password = body.password;
                        if (body.message === undefined) {
                            message = "";
                        }
                        else {
                            message = body.message;
                        }
                        const hash = await bcrypt.hash(password, saltRounds);
                        try {
                            //For the query just follow the same format as stated in the mysql2 docs
                            const query = 'INSERT INTO `user`(`username`, `password`, `message`) VALUES (?, ?, ?)';
                            const values = [username, hash, message];
                            const [result, fields] = await connectToDB.execute(query, values);
                            res.writeHead(201, { 'Content-Type': 'text/plain' });
                            res.write("Successfully created the new user");
                            res.end();
                        }
                        catch (error) {
                            res.writeHead(501, { 'Content-Type': 'text/plain' });
                            res.write("Server error in trying to sign a user up");
                            res.end();
                            console.error(error);
                        }
                    });
                }
                catch (error) {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.write("Server error in trying to sign a user up");
                    res.end();
                    console.log(error);
                }
            }
            break;
        default:
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write("Incorrect path");
            res.end();
            break;
    }
});
server.listen(port, () => console.log(`Server listening on port ${port}`));
