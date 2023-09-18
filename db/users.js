const bcrypt = require('bcrypt');
const { generateError } = require('../helpers');
const { getConnection } = require('./db');

const getUserByEmail = async (email) => {
  let connection;

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      `
    SELECT * FROM users WHERE email = ?
    `,
      [email]
    );

    if (result.length === 0)
      throw generateError('No hay ningún usuario con ese email', 404);

    return result[0];
  } finally {
    if (connection) connection.release();
  }
};

//Crea un usuario en la BD y devuelve su id
const createUser = async (user_name, email, password) => {
  let connection;

  try {
    connection = await getConnection();

    //Comprobar que no exista otro usuario con ese email
    const [user] = await connection.query(
      `
      SELECT id FROM users WHERE email = ?
    `,
      [email]
    );

    if (user.length > 0) {
      throw generateError(
        'Ya existe un usario en la base de datos con ese email',
        409
      );
    }

    //Comprobar que no exista otro usuario con igual nombre de usuario
    const [user_nick] = await connection.query(
      `
      SELECT id FROM users WHERE user_name = ?
    `,
      [user_name]
    );

    if (user_nick.length > 0) {
      throw generateError(
        'Ya existe un usario en la base de datos con ese nickname',
        409
      );
    }

    //Encriptar la password
    const passwordHash = await bcrypt.hash(password, 8);

    //Crear el usuario
    const [newUser] = await connection.query(
      `
    INSERT INTO users (user_name, email, password) VALUES(?, ?, ?)
    `,
      [user_name, email, passwordHash]
    );

    //Devolver la id
    return newUser.insertId;
  } finally {
    if (connection) connection.release();
  }
};

const getUserById = async (id) => {
  let connection;

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      `
      SELECT id, name, email, user_name, bio, profile_image, created_at FROM users WHERE id = ?
    `,
      [id]
    );

    if (result.length === 0) {
      throw generateError('No hay ningún usuario con esa id', 404);
    }

    return result[0];
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
