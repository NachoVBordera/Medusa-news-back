require('dotenv').config();
const { getConnection } = require('./db');
const bcrypt = require('bcrypt');
const { MYSQL_DATABASE } = process.env;

async function main() {
  let connection;

  try {
    connection = await getConnection();

    await connection.query(`USE ${MYSQL_DATABASE};`);

    console.log('Borrando tablas existentes...');

    await connection.query('DROP TABLE IF EXISTS votes_news;');
    await connection.query('DROP TABLE IF EXISTS subjects_news;');
    await connection.query('DROP TABLE IF EXISTS subjects;');
    await connection.query('DROP TABLE IF EXISTS news;');
    await connection.query('DROP TABLE IF EXISTS users;');

    console.log('Creando tablas...');

    await connection.query(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) DEFAULT " ",
        user_name VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(25) DEFAULT "user",
        bio VARCHAR(500) DEFAULT " ",
        profile_image VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME null
      );
    `);

    await connection.query(`
    CREATE TABLE news (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(150) NOT NULL,
      introduction VARCHAR(500),
      image VARCHAR(100),
      body TEXT NOT NULL,
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `);

    await connection.query(`
    CREATE TABLE subjects(
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      subject VARCHAR(20) UNIQUE NOT NULL
  )`);

    await connection.query(`
    CREATE TABLE subjects_news(
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      subject_id INTEGER NOT NULL,
      news_id INTEGER NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    )`);

    await connection.query(`
    CREATE TABLE votes_news(
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      news_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      up_vote INT,
      down_vote INT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (news_id) REFERENCES news(id)
    )`);

    if (process.argv.includes('--fill')) {
      const password = 'root1234';
      const passwordHash = await bcrypt.hash(password, 8);
      console.log('Generando usuarios');
      await connection.query(
        `
    INSERT INTO users 
    (user_name, email, password) 
    VALUES
    ('David', 'david@gmail.com', ?),
    ('Nacho', 'nacho@gmail.com', ?),
    ('Rocio', 'rocio@gmail.com', ?),
    ('Gael', 'gael@gmail.com', ?),
    ('Andres', 'andres@gmail.com', ?),
    ('Eva', 'eva@gmail.com', ?),
    ('Alex', 'alex@gmail.com', ?)
    `,
        [
          passwordHash,
          passwordHash,
          passwordHash,
          passwordHash,
          passwordHash,
          passwordHash,
          passwordHash,
        ]
      );
      console.log('Generando noticias');
      await connection.query(
        `
      INSERT INTO news(title,introduction, body,user_id )
      VALUES
       ('Un gato asume que morirá de hambre al ver su bol de comida medio vacío',
       'SE IMAGINA EL DEMACRADO CADÁVER QUE DEJARÁ TRAS DE SÍ',
       'El gato, llamado Sauron, se ha mostrado sorprendido al comprobar que su bol
       de comida está medio vacío y ha asumido que morirá de hambre. Tras confirmar
       que no le queda comida para gatos suficiente para el resto de su vida, 
       se ha preparado para morir.', 
      1),

      ('Un gato pierde la autoestima porque en diez años de relación no ha conseguido
      provocar un ronroneo a su dueña ni una sola vez',
      'LOS VETERINARIOS RECOMIENDAN FINGIR EL RONRONEO POR EL BIEN DEL ANIMAL',
      'Sintiéndose culpable porque él sí ha ronroneado muchas veces, Chispi, un gato natural 
       de Cornellà de Llobregat, ha perdido toda la autoestima porque en diez años de relación 
       no ha conseguido provocar un ronroneo a su dueña ni una sola vez. El felino lo ha probado 
       todo, desde despertarla por la noche hasta frotarse con su lomo por la pierna o arañar las 
       cortinas, pero no ha conseguido nada.
       La autoconfianza de este gato está absolutamente mermada: se siente feo, inútil y teme que
       en cualquier momento su dueña se vaya con un gato mejor. “Hemos empezado a dormir separados”,
       admite el animal. El gato se ha cansado de que su dueña lo eche de la cama y ha empezado a 
       dormir en el sofá. -No sé si ronronea cuando yo no estoy, pero conmigo delante jamás-, 
       lamenta.',
       2),

      ('Un gato observa con indiferencia la destrucción personal de su dueño',
      'SI MUERE, SE LO COMERÁ',
      'Un gato doméstico lleva dos meses asistiendo al proceso de derrumbe emocional 
      y económico de su dueño, un empresario alicantino de mediana edad en plena crisis 
      con quien ha compartido la totalidad de su vida y que, objetivamente, se lo ha dado todo.
      El animal ha pasado la mañana jugando con unas pastillas de colores que ha encontrado en el
       suelo y que cayeron de la boca del dueño, que yace aún en el sofá raído del salón desnudo y 
       con ganas de morir.',
       2),

      ('Un escritor olvida un signo de exclamación de cierre y obliga a leer toda su novela gritando',
      'VARIOS LECTORES SE HAN QUEDADO AFÓNICOS Y HAN SUFRIDO ATAQUES DE ANSIEDAD',
       'Alfonso Guzmán Ramírez, autor de la novela «Espiral de otoño», cometió un error que ha llenado 
       esta semana las librerías de clientes descontentos exigiendo soluciones. Guzmán abrió una frase 
       del primer capítulo con una exclamación que luego olvidó cerrar, forzando a sus lectores a leer
        más de 340 páginas gritando.',
        3),
      ('Estas son las mejores empresas tecnológicas para trabajar en España',
      'Como expertos en el sector tecnológico, en teknopleo.com -el portal 
      de empleo líder en Informática, Telecomunicaciones y Tecnología- ha seleccionado 
      las mejores empresas para trabajar en España. Son estas:',
      
       'La segunda página de Google
        La segunda página de las búsquedas de Google es siempre un lugar tranquilo al que nunca va nadie.
        Hay realmente muy poco trabajo allí. Si necesitas un empleo poco exigente pero prestigioso, 
        es perfecto.
        La -start up- de tu colega Rubén
        Rubén busca un colega con el que encerrarse en el garaje de sus padres para fundar la 
        nueva Apple.Tú te apuntas siempre a las partidas del Catán. Y al fútbol. Rubén cuenta contigo.
        Tintinder
        Juanjo Martínez y Rosa Gamboa son dos programadores y fans de Tintín que han desarrollado 
        una app para que los amantes de este héroe del cómic puedan quedar entre ellos. Si te gusta 
        Tintín, usas Tinder y te dedicas al desarrollo y mantenimiento de aplicaciones, llámales.',
        3)
      `
      );
      console.log('Generando votaciones');
      await connection.query(
        `
      INSERT INTO votes_news(up_vote, down_vote, news_id, user_id)
      VALUES
      (1, 0, 1, 1),
      (1, 0, 1, 3),
      (1, 0, 1, 4),
      (1, 0, 1, 7),
   
      (1, 0, 2, 3),
      (1, 0, 2, 4),
      (1, 0, 2, 6),
     
      (1, 0, 3, 4),
      (1, 0, 3, 7),

      (1, 0, 4, 3), 
      (1, 0, 4, 4),
      (1, 0, 4, 7),
 
      (1, 0, 5, 3),
      (1, 0, 5, 4),
      (1, 0, 5, 6)

      `
      );
      console.log('Creando temas');
      await connection.query(
        `
      INSERT INTO subjects (subject) 
      VALUES 
      ('technology'),
      ('cats'),
      ('culture')
    `
      );
      await connection.query(
        `
      INSERT INTO subjects_news (news_id, subject_id) VALUES 
      (1,2),
      (2,2),
      (3,2),
      (4,3),
      (5,1)
    `
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

main();
