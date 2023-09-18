const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { nanoid } = require('nanoid');
const { getConnection } = require('./db/db');

const generateError = (message, status) => {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
};

const createPathIfNotExists = async (path) => {
  try {
    await fs.access(path);
  } catch {
    await fs.mkdir(path);
  }
};

const imageUploadPath = path.join(__dirname, process.env.UPLOADS_DIRPROFILE);

async function processAndSaveImage(uploadedImage) {
  // Creamos el directorio (con recursive: true por si hay subdirectorios y así no da error)
  await fs.mkdir(imageUploadPath, { recursive: true });

  //Procesar la imagen
  const image = sharp(uploadedImage.data);
  image.resize(500);

  // Guardar la imagen en el directorio de subidas
  const imageFileName = `${nanoid(30)}.jpg`;
  await image.toFile(path.join(imageUploadPath, imageFileName));

  // Devolver el nombre con el que fue guardada
  return imageFileName;
}

const createSubjectIfNotExsists = async (subject) => {
  let connection;

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      `
      SELECT * FROM subjects WHERE subject = ?
    `,
      [subject]
    );

    if (result.length === 0) {
      await connection.query(
        `
      INSERT INTO subjects (subject) VALUES (?)
    `,
        [subject]
      );
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (connection) connection.release();
  }
};

const getSubjectId = async (subject) => {
  let connection;

  try {
    connection = await getConnection();

    const id = await connection.query(
      `
    SELECT 
      id
    FROM
      News_Server.subjects WHERE subject = ?
  `,
      [subject]
    );

    return id[0][0].id;
  } catch (error) {
    console.log(error);
  } finally {
    if (connection) connection.release();
  }
};
const getCurrentIds = async (newId) => {
  let connection;

  try {
    connection = await getConnection();

    const ids = await connection.query(
      `
    SELECT 
    subject_id 
    FROM News_Server.subjects_news 
    where news_id=?
  `,
      [newId]
    );

    return ids[0];
  } catch (error) {
    console.log(error);
  } finally {
    if (connection) connection.release();
  }
};

const getLastPostCreatedId = async () => {
  let connection;
  try {
    connection = await getConnection();

    const id = await connection.query(
      `
      SELECT 
      id
    FROM
      News_Server.news order by id DESC
  `
    );

    return id[0][0].id;
  } catch (error) {
    console.log(error);
  } finally {
    if (connection) connection.release();
  }
};
module.exports = {
  generateError,
  createPathIfNotExists,
  processAndSaveImage,
  createSubjectIfNotExsists,
  getSubjectId,
  getLastPostCreatedId,
  getCurrentIds,
};
