"use strict";
const jwt = require('jsonwebtoken');
//Might need to make a new object type that extends the userInfo to make a flag to see if the 
const jwtSign = (payload) => {
    const token = jwt.sign(payload, process.env.SECRET_KEY);
    return { accessToken: token };
};
const jwtVerify = (token) => {
    const result = jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err)
            return null;
        else
            return user;
    });
    return result;
};
module.exports = { jwtSign, jwtVerify };
