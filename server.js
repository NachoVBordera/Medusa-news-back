require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { authUser } = require('./middlewares/auth');
const { checkTokenExpiration } = require('./middlewares/checkTokenExpiration');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 8888;
const {
  getPostsController,
  createPostController,
  getSinglePostController,
  deletePostController,
  updatePostController,
  votePostController,
  searchPostController,
  getPostsBySubjectController,
  getUsersVotesController,
  getPostsByUserController,
} = require('./controllers/posts');
const app = express();

const {
  newUserController,
  loginController,
  updateUserProfile,
  getUserController,
  getMeController,
} = require('./controllers/users');

app.use(cors());
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(fileUpload());
app.use('/uploads', express.static('./uploads'));

//Endpoints de usuario
app.post('/register', newUserController);
app.post('/login', loginController);
app.get('/user/:id', getUserController);
app.get('/user', authUser, checkTokenExpiration, getMeController);
app.put('/editProfile/:id', authUser, checkTokenExpiration, updateUserProfile);

//Endpoints de noticias
app.get('/', getPostsController);
app.post('/', authUser, checkTokenExpiration, createPostController);
app.get('/new/:id', getSinglePostController);
app.delete('/new/:id', authUser, checkTokenExpiration, deletePostController);
app.get('/newUser/:userId', getPostsByUserController);
app.put('/new/:id', authUser, checkTokenExpiration, updatePostController);
app.get('/search', searchPostController);
app.put('/:id/:type', authUser, checkTokenExpiration, votePostController);
app.get('/subject/:subject', getPostsBySubjectController);
app.get('/infoVotes/:id/:userId', getUsersVotesController);

//Middleware que gestiona rutas no definidas
app.use((req, res) => {
  res.status(404).send({
    status: 'error',
    message: 'Not found',
  });
});

//Middleware de gestión de errores
app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.httpStatus || 500).send({
    status: 'error',
    message: error.message,
  });
});

//Levantando el server
app.listen(port, () => {
  console.log(`APP listening on port ${port}`);
});
