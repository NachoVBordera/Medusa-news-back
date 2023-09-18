const joi = require('joi');
const path = require('path');
const sharp = require('sharp');
const { nanoid } = require('nanoid');

const {
  generateError,
  createPathIfNotExists,
  createSubjectIfNotExsists,
} = require('../helpers');

const {
  getPostById,
  getDeletePostById,
  createPost,
  getPosts,
  votePosts,
  updatePost,
  getPostsByKeyword,
  insertSubjectPost,
  getPostsBySubject,
  getUsersVotes,
  getPostByUser,
} = require('../db/posts');

const getPostsController = async (req, res, next) => {
  try {
    const posts = await getPosts();

    res.send({
      status: 'ok',
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

const createPostController = async (req, res, next) => {
  try {
    const { title, introduction, subject, body } = req.body;
    const userId = req.userId;
    const schema = joi.object().keys({
      title: joi
        .string()
        .max(150)
        .required()
        .error(
          new Error(
            'El titulo no puede estar vacio ni contener más de 150 caracteres'
          )
        ),
      introduction: joi
        .string()
        .max(300)
        .required()
        .error(
          new Error(
            'La introducción no puede estar vacia ni contener más de 300 caracteres'
          )
        ),
      subject: joi
        .string()
        .max(25)
        .required()
        .error(
          new Error(
            'El tema no puede estar vacio ni contener más de 25 caracteres'
          )
        ),
      body: joi
        .string()
        .required()
        .error(new Error('El texto no puede estar vacio')),
    });

    const validation = await schema.validateAsync({
      title,
      introduction,
      subject,
      body,
    });
    if (validation.error) {
      res.status(500).send(validation.error);
    }
    await createSubjectIfNotExsists(subject);

    await insertSubjectPost(subject);

    let imageFileName;

    if (req.files && req.files.image) {
      const imagesDir = path.join(__dirname, process.env.UPLOADS_DIRNEWS);
      await createPathIfNotExists(imagesDir);

      const image = sharp(req.files.image.data);
      image.resize(1000);

      imageFileName = `${nanoid(30)}.jpg`;
      await image.toFile(path.join(imagesDir, imageFileName));
    }

    const id = await createPost(
      title,
      introduction,
      imageFileName,
      body,
      userId
    );

    res.send({
      status: 'ok',
      message: `Noticia creada correctamente con id: ${id}`,
    });
  } catch (err) {
    next(err);
  }
};

const getSinglePostController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newItem = await getPostById(id);

    res.send({
      status: 'ok',
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

const searchPostController = async (req, res, next) => {
  try {
    const searchParam = req.query.keyword;

    if (!searchParam) {
      throw generateError('Introduzca un término de búsqueda', 400);
    }

    const searchResult = await getPostsByKeyword(searchParam);

    res.send({
      status: 'ok',
      data: searchResult,
    });
  } catch (error) {
    next(error);
  }
};

const deletePostController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const newItem = await getPostById(id);
    console.log(newItem);
    if (req.userId !== newItem.user_id) {
      throw generateError(
        'Estás intentando borrar una noticia que no es tuya',

        401
      );
    }

    await getDeletePostById(id);

    res.send({
      status: 'ok',

      message: `La noticia con id: ${id} ha sido borrado`,
    });
  } catch (error) {
    next(error);
  }
};
const updatePostController = async (req, res, next) => {
  try {
    const { title, introduction, body, subject } = req.body;
    const { id } = req.params;
    //validar con joi
    const schema = joi.object().keys({
      title: joi
        .string()
        .max(150)
        .required()
        .error(
          new Error(
            'El titulo no puede estar vacio ni contener más de 150 caracteres'
          )
        ),
      introduction: joi
        .string()
        .max(300)
        .required()
        .error(
          new Error(
            'La introducción no puede estar vacia ni contener más de 300 caracteres'
          )
        ),
      subject: joi
        .string()
        .max(25)
        .required()
        .error(
          new Error(
            'El tema no puede estar vacio ni contener más de 25 caracteres'
          )
        ),
      body: joi
        .string()
        .required()
        .error(new Error('El texto no puede estar vacio')),
    });
    const validation = await schema.validateAsync({
      title,
      subject,
      introduction,
      body,
    });
    if (validation.error) {
      throw generateError(`${validation.error}`, 401);
    }

    const newItem = await getPostById(id);

    if (newItem.user_id !== req.userId) {
      throw generateError('No tienes permiso para modificar esta noticia', 403);
    }
    await createSubjectIfNotExsists(subject);

    let imageFileName;

    if (req.files && req.files.image) {
      const imagesDir = path.join(__dirname, process.env.UPLOADS_DIRNEWS);

      await createPathIfNotExists(imagesDir);

      const image = sharp(req.files.image.data);
      image.resize(1000);

      imageFileName = `${nanoid(30)}.jpg`;
      await image.toFile(path.join(imagesDir, imageFileName));
    }

    await updatePost({
      title,
      imageFileName,
      introduction,
      body,
      subject,
      id,
    });
    console.log('paso');
    res.send({
      status: 'ok',
      message: `La Noticia ha sido modificada.`,
    });
  } catch (err) {
    next(err);
  }
};

const votePostController = async (req, res) => {
  try {
    const type = req.params.type;
    const newId = req.params.id;
    const userId = req.userId;
    await getPostById(newId);
    await votePosts(type, newId, userId);

    res.send({
      status: 'ok',
      message: 'Voto ha sido registrasdo',
    });
  } catch (error) {
    throw generateError('Error en la base de datos', 500);
  }
};

const getPostsBySubjectController = async (req, res, next) => {
  try {
    const subject = req.params.subject;
    const posts = await getPostsBySubject(subject);

    res.send({
      status: 'ok',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getUsersVotesController = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.params.userId;
    const votes = await getUsersVotes(postId, userId);
    // console.log('[getUsersVotesController]: ', votes);
    if (votes.length) {
      res.send({
        status: 'ok',
        data: votes,
        vote: true,
      });
    } else {
      res.send({
        status: 'ok',
        data: votes,
        vote: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getPostsByUserController = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const posts = await getPostByUser(userId);

    res.send({
      status: 'ok',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPostsController,
  createPostController,
  getSinglePostController,
  deletePostController,
  updatePostController,
  searchPostController,
  votePostController,
  getPostsBySubjectController,
  getUsersVotesController,
  getPostsByUserController,
};
