const bcrypt = require('bcrypt');
const joi = require('joi');
const jwt = require('jsonwebtoken');

const { generateError, processAndSaveImage } = require('../helpers');
const { createUser, getUserByEmail, getUserById } = require('../db/users');
const { getConnection } = require('../db/db');

const newUserController = async (req, res, next) => {
  try {
    const { user_name, email, password } = req.body;

    const schema = joi.object().keys({
      user_name: joi
        .string()
        .min(4)
        .max(100)
        .required()
        .error(
          generateError('Nombre de usuario mín. 4 caracteres máx. 100', 400)
        ),
      email: joi
        .string()
        .email()
        .required()
        .error(generateError('Debe ser un email válido', 400)),
      password: joi
        .string()
        .min(8)
        .required()
        .error(generateError('Password mín. 8 caracteres', 400)),
    });

    const validation = await schema.validateAsync({
      user_name,
      email,
      password,
    });

    if (validation.error) {
      throw generateError(validation.error, 400);
    }

    const id = await createUser(user_name, email, password);

    res.send({
      status: 'ok',
      message: `Usuario creado con id: ${id}`,
    });
  } catch (error) {
    next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Se valida el email y password
    const schema = joi.object().keys({
      email: joi
        .string()
        .email()
        .required()
        .error(generateError('Debe ser un email válido', 400)),
      password: joi
        .string()
        .min(8)
        .required()
        .error(generateError('Password mín. 8 caracteres', 400)),
    });

    const validation = await schema.validateAsync({ email, password });

    if (validation.error) {
      throw generateError('Email o password incorrectos', 400);
    }

    //Recojo los datos de la BD del usuario con ese email
    const user = await getUserByEmail(email);

    //Compruebo que las contraseñas coinciden
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw generateError('La contraseña no coincide', 401);
    }

    //Creo el payload del token
    const payload = { id: user.id };

    //Firmo el token, válido por 30 días
    const token = jwt.sign(payload, process.env.SECRET, {
      expiresIn: '30d',
    });

    //Envío el token
    res.send({
      status: 'ok',
      data: token,
      userName: user.user_name,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  let connection;

  try {
    connection = await getConnection();

    const { id } = req.params;
    const { name, bio, password1, password2 } = req.body;

    const [currentUser] = await connection.query(
      `
      SELECT id, name, bio, profile_image, password
      FROM users
      WHERE id = ?;
      `,
      [id]
    );

    if (currentUser.length === 0) {
      throw generateError(`El usuario con id ${id} no existe`, 404);
    }

    if (Number(id) !== req.userId) {
      throw generateError('No tienes permisos para editar este usuario', 403);
    }

    let updatedProfileImage = currentUser[0].profile_image;

    if (req.files && req.files.image) {
      try {
        // Procesar y guardar imagen
        updatedProfileImage = await processAndSaveImage(req.files.image);
      } catch {
        throw generateError(
          'No se pudo procesar la imagen. Inténtalo de nuevo',
          400
        );
      }
    }

    const updatedName = name;
    const updatedBio = bio;
    const updatedPassword1 = password1;
    const updatedPassword2 = password2;
    const schema = joi.object().keys({
      updatedName: joi
        .string()
        .min(0)
        .max(100)
        .allow('')
        .error(
          generateError('Nombre mín. 3 caracteres, máx. 100 caracteres', 400)
        ),
      updatedBio: joi
        .string()
        .min(0)
        .max(500)
        .allow('')
        .error(
          generateError(
            'Biografía mín. 25 caracteres, máx. 500 caracteres',
            400
          )
        ),
      updatedPassword1: joi
        .string()
        .min(8)
        .allow('')
        .error(generateError('Password mín. 8 caracteres', 400)),
      updatedPassword2: joi
        .string()
        .min(8)
        .allow('')
        .error(generateError('Password mín. 8 caracteres', 400)),
    });

    await schema.validateAsync({
      updatedName,
      updatedBio,
      updatedPassword1,
      updatedPassword2,
    });

    if (updatedPassword1 !== updatedPassword2) {
      throw generateError('Las contraseñas no coinciden');
    }

    let passwordHash;

    if (updatedPassword1) {
      passwordHash = await bcrypt.hash(updatedPassword1, 8);
    } else {
      passwordHash = currentUser[0].password;
    }

    //console.log(updatedName, updatedBio, passwordHash, updatedProfileImage, id);

    try {
      await connection.query(
        `UPDATE users 
      SET name = ?, bio = ?, password = ?, profile_image = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
        [updatedName, updatedBio, passwordHash, updatedProfileImage, id]
      );
    } catch {
      throw generateError('Error en la base de datos', 500);
    } finally {
      if (connection) connection.release();
    }
    res.send({
      status: 'ok',
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const getUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    res.send({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getMeController = async (req, res, next) => {
  try {
    const user = await getUserById(req.userId, false);

    res.send({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  newUserController,
  loginController,
  updateUserProfile,
  getUserController,
  getMeController,
};
