const router = require("express").Router();
const verifyToken = require("./authentication");

const {RegisterUser, LoginUser, VerifyUserCredentials, UpdateUserPassword} = require('../Controller/auth_api')

 router.post('/register', RegisterUser);
 router.post('/login', LoginUser);
 router.post('/verifyUser', VerifyUserCredentials);
 router.post('/updatePassword', UpdateUserPassword);

 



module.exports = router;