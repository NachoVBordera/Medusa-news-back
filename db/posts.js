const {
  generateError,
  getSubjectId,
  getLastPostCreatedId,
  createSubjectIfNotExsists,
  getCurrentIds,
} = require('../helpers');
const { getConnection } = require('./db');

const getPostById = async (id) => {
  let connection;
  try {
    connection = await getConnection();

    const [result] = await connection.query(
      `
      SELECT 
      news.id,
      news.title,
      news.image,
      news.introduction,
      news.body, 
      news.create_date, 
      news.user_id,
      upVote,
      downVote, 
      subjects.subject
    FROM 
      news
    inner join subjects_news
    on subjects_news.id = news.id 
    inner join subjects
    on subjects_news.subject_id = subjects.id
    left join 
    (SELECT  
    news_id,
      SUM(up_vote) as upVote,
      SUM(down_vote) as downVote
    FROM votes_news group by news_id ) s
    on news.id = s.news_id 
    where news.id = ?
    `,
      [id]
    );

    if (result.length === 0) {
      throw generateError(`La noticia con id: ${id} no existe`, 404);
    }

    return result[0];
  } finally {
    if (connection) connection.release();
  }
};

const getDeletePostById = async (id) => {
  let connection;
  try {
    connection = await getConnection();

    await connection.query(
      `
    SET FOREIGN_KEY_CHECKS=0;
    `
    );

    await connection.query(
      `
    DELETE FROM news WHERE id = ?
    `,
      [id]
    );

    await connection.query(
      `
    SET FOREIGN_KEY_CHECKS=1;
    `
    );

    return;
  } finally {
    if (connection) connection.release();
  }
};

const getPosts = async () => {
  let connection;
  try {
    connection = await getConnection();
    const posts = await connection.query(` 
    SELECT 
    news.id,
    news.title,
    news.image,
    news.introduction,
    news.body, 
    news.create_date, 
    news.user_id,
    upVote,
    downVote, 
    subjects.subject,
    users.user_name
  FROM 
    news
  inner join subjects_news
  on subjects_news.id = news.id 
  inner join subjects
  on subjects_news.subject_id = subjects.id
  left join 
  (SELECT  
  news_id,
    SUM(up_vote) as upVote,
    SUM(down_vote) as downVote
  FROM votes_news group by news_id ) s
  on news.id = s.news_id 
    inner join users
  on news.user_id = users.id
  order by news.create_date DESC
    `);

    return posts[0];
  } finally {
    if (connection) connection.release();
  }
};

const createPost = async (
  title,
  introduction,
  imageFileName = '',
  body,
  userId
) => {
  let connection;
  try {
    console.log('POST', { title, introduction, imageFileName, body, userId });
    connection = await getConnection();

    const [result] = await connection.query(
      `
      INSERT INTO news(title, introduction, image, body,user_id )
      VALUES (?, ?, ?, ?, ?);
      `,
      [title, introduction, imageFileName ?? '', body, userId]
    );

    return result.insertId;
  } catch (err) {
    throw generateError('Error en la base de datos', 500);
  } finally {
    connection.release();
  }
};

const insertSubjectPost = async (subject) => {
  let connection;
  try {
    connection = await getConnection();
    const postId = await getLastPostCreatedId();
    const lastId = postId + 1;

    const inserSub = async (subject) => {
      await createSubjectIfNotExsists(subject);
      const subjectId = await getSubjectId(subject);
      await connection.query(
        `
            INSERT INTO subjects_news (news_id, subject_id) 
            VAlUES (?, ?)
            `,
        [lastId, subjectId]
      );
    };

    inserSub(subject);
  } catch (error) {
    throw generateError('Error en la base de datos', 500);
  }
};

const updatePost = async ({
  title,
  imageFileName,
  introduction,
  body,
  subject,
  id,
}) => {
  let connection;

  try {
    connection = await getConnection();

    const currentPost = await getPostById(id);
    /*   console.log(
      '[UPDATENEW] =>',
      'NOTICIA MODIFICADA',
      {
        title,
        imageFileName,
        introduction,
        body,
        subject,
        id,
      },
      'NOTICIA ORIGINAL',
      currentPost
    ); */

    await connection.query(
      `
    UPDATE news SET title=?, introduction=?, body=?,  image=? WHERE id = ?
    `,
      [
        title ?? currentPost.title,
        introduction ?? currentPost.introduction,
        body ?? currentPost.body,
        imageFileName ?? currentPost.image,
        id,
      ]
    );
    //update subject
    const postId = currentPost.id;

    if (subject !== undefined) {
      const currentSubjects = [subject];
      const currentSubject = await getCurrentIds(postId);

      const updateSub = async (subject = 'none', currentSubjectId = 'none') => {
        //paso el tema NUEVO por si no tiene id crearselo
        await createSubjectIfNotExsists(subject);
        //recojo el ID del tema NUEVO
        const subjectId = await getSubjectId(subject);

        await connection.query(
          `
          UPDATE subjects_news SET  subject_id=? WHERE subject_id=? and news_id=?  
          
          `,
          [subjectId, currentSubjectId, postId]
        );
      };

      const currentSubjectId = currentSubject.subject_id ?? 1;

      updateSub(subject, currentSubjectId);
    }
  } catch (err) {
    throw generateError('Error en la base de datos', 500);
  } finally {
    if (connection) connection.release();
  }
};
const votePosts = async (type, postId, userId) => {
  let connection;
  try {
    connection = await getConnection();
    //comprovar si hay voto
    /*   const [currentVote] = await connection.query(
      `
  SELECT id FROM votes_news WHERE news_id = ? and user_id = ?;
  `,
      [newId, userId]
    ); */

    //si es up
    if (type === 'up') {
      //no hay voto

      await connection.query(
        `
        INSERT INTO votes_news(up_vote, down_vote, news_id, user_id) VALUES(1, 0, ?, ?);
        `,
        [parseInt(postId), userId]
      );
    }
    /* //si hay voto
      if (currentVote.length) {
        await connection.query(
          `
          UPDATE votes_news set up_vote = 1, down_vote = 0 WHERE id = ?;
          `,
          [currentVote[0].id]
        );
      } */

    if (type === 'down') {
      //no hay voto
      /* if (!currentVote.length) {
        await connection.query(
          `
        INSERT INTO votes_news(up_vote, down_vote, news_id, user_id) VALUES(0, 1, ?, ?);
        `,
          [parseInt(newId), userId]
        );
      } */
      //si hay voto

      await connection.query(
        `
          delete  FROM News_Server.votes_news where news_id = ? and user_id = ?;
          `,
        [parseInt(postId), userId]
      );
    }
  } catch (err) {
    throw generateError('Error en la base de datos', 500);
  } finally {
    if (connection) connection.release();
  }
};

const getPostsByKeyword = async (searchParam) => {
  let connection;

  let finder = searchParam.toLowerCase();

  try {
    connection = await getConnection();
    const posts = await connection.query(
      ` 
    SELECT 
    news.id,
    news.title,
    news.image,
    news.body, 
    news.create_date, 
    news.user_id,
    upVote,
    downVote, subjects.subject
  FROM 
    news
  inner join subjects_news
  on subjects_news.id = news.id 
  inner join subjects
  on subjects_news.subject_id = subjects.id
  left join 
  (SELECT  
  news_id,
    SUM(up_vote) as upVote,
    SUM(down_vote) as downVote
  FROM votes_news group by news_id ) s
  on news.id = s.news_id  
    WHERE subjects.subject LIKE ? ORDER BY news.create_date DESC
    `,
      [`%${finder}%`]
    );

    if (posts[0].length === 0) {
      throw generateError('No hay ningún tema para listar', 500);
    }

    return posts[0];
  } finally {
    if (connection) connection.release();
  }
};

const getSubjectById = async (id) => {
  let connection;

  try {
    connection = await getConnection();
    const subject = await connection.query(
      `SELECT 
   subjects.subject
    FROM News_Server.news  
   inner join subjects_news
     on subjects_news.id = news.id 
   inner join subjects
     on subjects_news.subject_id = subjects.id 
   where subjects_news.news_id = ?`,
      [id]
    );

    if (subject[0].length === 0) {
      throw generateError('Error en la base de datos', 500);
    }

    return subject[0];
  } finally {
    if (connection) connection.release();
  }
};

const getPostsBySubject = async (subject) => {
  let connection;
  try {
    connection = await getConnection();
    const posts = await connection.query(
      ` 
    SELECT 
    news.id,
    news.title,
    news.image,
    news.introduction,
    news.body, 
    news.create_date, 
    news.user_id,
    upVote,
    downVote, 
    subjects.subject
  FROM 
    news
  inner join subjects_news
  on subjects_news.id = news.id 
  inner join subjects
  on subjects_news.subject_id = subjects.id
  left join 
  (SELECT  
  news_id,
    SUM(up_vote) as upVote,
    SUM(down_vote) as downVote
  FROM votes_news group by news_id ) s
  on news.id = s.news_id 
  where subjects.subject LIKE ?
  order by news.create_date DESC
    `,
      [`%${subject}%`]
    );

    return posts[0];
  } finally {
    if (connection) connection.release();
  }
};

const getUsersVotes = async (postId, userId) => {
  let connection;
  try {
    connection = await getConnection();
    const votes = await connection.query(
      ` 
      SELECT 
       user_id 
       FROM 
       News_Server.votes_news
      where 
        news_id = ?
        and user_id = ?
        ;
 
    `,
      [postId, userId]
    );

    return votes[0];
  } finally {
    if (connection) connection.release();
  }
};

const getPostByUser = async (userId) => {
  let connection;
  try {
    connection = await getConnection();
    const posts = await connection.query(
      ` 
      SELECT 
      news.id,
      news.title,
      news.image,
      news.introduction,
      news.body, 
      news.create_date, 
      news.user_id,
      upVote,
      downVote, 
      subjects.subject
    FROM 
      news
    inner join subjects_news
    on subjects_news.id = news.id 
    inner join subjects
    on subjects_news.subject_id = subjects.id
    left join 
    (SELECT  
    news_id,
      SUM(up_vote) as upVote,
      SUM(down_vote) as downVote
    FROM votes_news group by news_id ) s
    on news.id = s.news_id 
    where news.user_id = ?
    order by news.create_date DESC
 
    `,
      [userId]
    );

    return posts[0];
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getPostById,
  getDeletePostById,
  createPost,
  getPosts,
  votePosts,
  updatePost,
  getPostsByKeyword,
  insertSubjectPost,
  getSubjectById,
  getPostsBySubject,
  getUsersVotes,
  getPostByUser,
};
