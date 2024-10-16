const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const Token = require('../models/Token');
const { access } = require('fs');



//check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.uauthjwt;

    if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                res.send('Please login before accessing this page.')
            }else{
                //use accessPayload to access payload
                let user = await User.findById(accessPayload.id);
                res.locals.user = user;//this way, user can be used in views and we can tackle its attributes
                req.user = user;
                next();
            }
        })
    }else{
      const authHeader = req.headers['authorization'];
      const token1 = authHeader && authHeader.split(' ')[1];
      if(token1){
        jwt.verify(token1, process.env.SECRET_JWT, async (err, accessPayload) => {
            if(err){
                console.log(err);
                res.locals.user = null;
                req.user = null;
                res.send('Please login before accessing this page.')
            }else{
                //use accessPayload to access payload
                let user = await User.findById(accessPayload.id);
                res.locals.user = user;//this way, user can be used in views and we can tackle its attributes
                req.user = user;
                next();
            }
        })
      }else{
        res.locals.user = null;
        res.send('Please login before accessing this page.')
      }
    }
}

//check Traveler
const checkTraveler = (req, res, next) => {
  const token = req.cookies.tauthjwt;
  if(token){
    jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
      if(err){
        console.log(err);
        res.locals.user = null;
        req.user = null;
        next();
      }
      else{
        //use accessPayload to access payload
        let traveler = await Traveler.findById(accessPayload.id);
        res.locals.traveler = traveler;//this way, user can be used in views and we can tackle its attributes
        req.traveler = traveler;
        next();
      }
    })
  }
  else{
    const authHeader = req.headers['authorization'];
    const token1 = authHeader && authHeader.split(' ')[1];
    if(token1){
      jwt.verify(token1, process.env.SECRET_JWT, async (err, accessPayload) => {
        if(err){
          console.log(err);
          res.locals.user = null;
          req.user = null;
          res.send('Please login before accessing this page.')
        }
        else{
          //use accessPayload to access payload
          let traveler = await Traveler.findById(accessPayload.id);
          res.locals.traveler = traveler;//this way, user can be used in views and we can tackle its attributes
          req.traveler = traveler;
          next();
        }
      })
    }
    else{  
      res.locals.user = null;
      next();
    }
  }
}



const checkRPtoken = async (req, res, next) => {
    const token = req.params.token;
    if(token){
        try{
            const secret = process.env.SECRET_JWT;
            const payload = jwt.verify(token, secret);
            if(payload){
                next();
                return;
            }else{
                res.status(400).json({message: 'Invalid Token'})
                return;
            }
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured.'})
            return;
        }
    }else{
        res.status(400).json({message: 'Invalid Token'})
    }
}



const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const currentTime = Math.floor(Date.now() / 1000);
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized 0' });
    }
  
    try {
      const accessPayload = jwt.decode(token);
      if (!accessPayload) {
        await Token.deleteOne({ accessToken: token });
        return res.status(401).json({ message: 'Unauthorized 1' });
      }
  
      // Check if the token has expired
      
      if (accessPayload.exp < currentTime) {
        // Get the refresh token from the database
        const ARtoken = await Token.findOne({ accessToken: token });
  
        if (!ARtoken) {
          return res.status(401).json({ message: 'Unauthorized 2 because there is no AR in db' });
        }
  
        // Verify the refresh token and get its payload
        let decodedRefreshToken = jwt.decode(ARtoken.refreshToken);
        // Generate a new access token and save it in the database
        if(decodedRefreshToken && decodedRefreshToken.exp > currentTime){
          console.log("we Here")
          decodedRefreshToken = jwt.verify(ARtoken.refreshToken, process.env.SECRET_REFRESH_JWT);
            const newAccessToken = jwt.sign(
                { id: decodedRefreshToken.id, userType: decodedRefreshToken.userType },
                process.env.SECRET_JWT,
                { expiresIn: '2m' }
              );
              await Token.updateOne(
                { refreshToken: ARtoken.refreshToken },
                { accessToken: newAccessToken }
              );
              const decodedNAT = jwt.verify(newAccessToken, process.env.SECRET_JWT);
              req.userId = decodedNAT.id;
              req.userType = decodedNAT.userType;
              req.nat = newAccessToken;
              console.log("renewed the at");
              // Set the new access token in the response cookie
              next();
              return;
        }else{
            await Token.deleteOne({ accessToken: token });
            console.log("3")
            return res.status(401).json({ message: 'Unauthorized 3' });
        }
      }
  
      // Pass the user ID to the next middleware
      req.userId = accessPayload.id;
      req.userType = accessPayload.userType;
      req.nat = token;
      next();
      return;
    } catch (err) {
      console.log("5")
      console.log(err);
      await Token.deleteOne({ accessToken: token});
      return res.status(401).json({ message: 'Unauthorized 5' });
    }
  };

const checkToken_mb = async (req, res,next) => {
  try{
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if(token){
        jwt.verify(token, process.env.SECRET_JWT, async (err, accessPayload) => {
          if(err){
            req.stat = 692;
            next();
          }
          else{
            const traveler = await Traveler.findById(accessPayload.id);
            if(traveler){
              req.stat=690;
              next();
            }
            else{
              const client = await User.findById(accessPayload.id);
              if (client) {
                req.stat=691;
                next();
              }
              else{
                req.stat=692;
                next();
              }
            }
          }
        })
      }
      else{  
        req.stat=692;
        next();
      }
    }
  catch(err){
    console.log(err);
    req.stat=500;
    next();
  }}
  
module.exports = { checkUser, checkTraveler, checkRPtoken, requireAuth, checkToken_mb};








