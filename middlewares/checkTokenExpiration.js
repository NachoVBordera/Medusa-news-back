const jwt = require('jsonwebtoken');
const { getConnection } = require('../db/db');
const { generateError } = require('../helpers');

const checkTokenExpiration = async (req, res, next) => {
  let connection;

  try {
    connection = await getConnection();

    const [currentUser] = await connection.query(
      `
      SELECT *
      FROM users
      WHERE id = ?;
      `,
      [req.userId]
    );

    //console.log(req.userId);

    if (currentUser.length === 0) {
      throw generateError('El usuario no existe', 404);
    }

    console.log(req.headers);

    const now = new Date();
    const token = req.headers.authorization;
    console.log(token);
    const tokenData = jwt.verify(token, process.env.SECRET);
    const expirationTime = parseInt(process.env.JWT_EXPIRATION_TIME); // tiempo de expiración del token en segundos

    if (now.getTime() / 1000 > tokenData.iat + expirationTime) {
      throw generateError('El token ha caducado', 401);
    }

    next();
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  checkTokenExpiration,
};
