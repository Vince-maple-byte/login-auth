"use strict";
const mysql = require('mysql2/promise');
require('dotenv').config();
//Mysql database connection
const dbConnection = async () => {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE
    });
    return db;
};
module.exports = { dbConnection };
