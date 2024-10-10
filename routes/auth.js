const router = require("express").Router();
const verifyToken = require("./authentication");

const {RegisterUser, LoginUser, VerifyUserCredentials, UpdateUserPassword, VerifyPIN, ProtectedRoute, GetUserProfile, UpdateUserProfile, GoogleAuth, VerifyEmail} = require('../Controller/auth_api')

 router.post('/register', RegisterUser);
 router.post('/login', LoginUser);
 router.post('/google', GoogleAuth);
 router.post('/verifyUser', VerifyUserCredentials);
 router.post('/verifyEmail', VerifyEmail);
 router.post('/verifyPIN', VerifyPIN);
 router.post('/updatePassword', UpdateUserPassword);
 router.post('/protectedRoute', verifyToken, ProtectedRoute);
 router.post('/getProfile', verifyToken, GetUserProfile);
 router.post('/updateProfile', verifyToken, UpdateUserProfile);

 



module.exports = router;