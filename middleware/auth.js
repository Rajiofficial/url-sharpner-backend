import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (token) {
    let decode = jwt.verify(token, process.env.SECRET_KEY);
    if (decode) {
      req.userId = decode.id;
      next();
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } else if (token == '' || token == null) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default auth;
