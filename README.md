# Proyecto Noticias Colaborativas (HACK A BOSS JSB12RT)

Segundo proyecto del _Bootcamp Full Stack Developer_ para crear una **API** de noticias colaborativas tipo _Reddit_ o _Menéame_ correspondiente a la parte de _Backend_.

Esta **API** permite varias funcionalidades como son el registro de usuarios, login, listado de noticias... Que se expondrán con más detalle en su apartado correspondiente.

## Comenzando 🚀

Sigue estos pasos para poder usar esta **API** en tu máquina local a efectos de pruebas o desarrollo. Clona el repositorio en la carpeta que prefieras y continúa leyendo.

Recuerda modificar el archivo _.env_ de la ruta base en estas dos variables de _usuario_ y _password_ para que conecte con tu _base de datos_:

```
MYSQL_USER="tu_usuario"
MYSQL_PASSWORD="tu_password"
```

### Pre-requisitos 📋

❗ _Importante_ ❗

Para que la **API** funcione correctamente y antes de ejecutarse el iniciador de la _base de datos_ (en adelante _BD_), debe existir _préviamente_ una _BD_ local llamada **News_Server**.

### Instalación 🔧

Una vez clonado el repositorio en local y creada la _BD_ se debe ejecutar el comando de la terminal:

```
npm i
```

en la misma ruta donde se encuentra el archivo _server.js_ para instalar todas las dependencias necesarias para el funcionamineto de la **API** ya incluídas en el archivo _package.json_.

A continuación, hay que iniciar la _BD_ para crear las tablas correspondientes. Usa el comando siguiente de la terminal y en la misma ruta donde se encuentre el archivo _server.js_ para crear los elementos de la _BD_.

```
node db/initDB.js
```

Si se quiere que se rellenen datos en la _BD_ a modo de ejemplos listos para hacer consultas, usa el parámetro "--fill" de la siguiente manera:

```
node db/initDB.js --fill
```

Por supuesto, eres libre de testear todos los _endpoints_ de este proyecto por tu cuenta (crear tu propio usuario y noticias, por ejemplo) 😉

## Corriendo el servidor ⚙️

Cuando ya tengas los pre-requisitos listos, podrás lanzar el servidor con el siguiente comando de la terminal en la misma ruta que el archivo _server.js_ :

```
npm run dev
```

y si todo está correcto deberías ver algo así en la terminal:

```
> proyecto_noticias_colaborativas@1.0.0 dev
> nodemon server.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node server.js`
APP listening on port 8888
```

Pues ya está la **API** lista para usarse y el servidor corriendo.
Ahora desde este [enlace](https://lively-escape-602067.postman.co/workspace/ProyectoNews~80820a40-7334-4843-8458-e13eda568925/collection/24930100-a6e1b07c-1d40-4152-9308-0fb89d1abaff?action=share&creator=24930100) podrás utilizar todas las funcionalidades, que se detallarán a continuación, desde tu navegador con la herramienta **Postman** que fue utilizada para testear todos los _endpoints_.

## Endpoints 🔚

### De usuario

- '/register' Permite hacer el registro de un usuario (POST)
- '/login' Para hacer login y devuelve un token de usuario (POST)
- '/user' Muestra los datos del usuario logueado (GET)
- '/user/:id' Muestra los datos del usuario con esa id (GET)
- '/profile/:id' Permite editar los datos de usuario (Nombre, biografía, password) (PUT)

### De noticias

- '/' Lista todas las noticias por orden de fecha más reciente (GET)
- '/' Permite crear una noticia a un usuario registrado con autenticación (POST)
- '/new/:id' Muestra una sola noticia por su id (GET)
- '/new/:id' Permite borrar una noticia propia a un usuario registrado (DELETE)
- '/new/:id' Permite editar una noticia propia a un usuario registrado (PUT)
- '/search' Buscar noticias con el parámetro indicado en la query string, keyword=valor (GET)
- '/:id/:type' Da un voto positivo o negativo a una noticia '/1/up' o /1/down (PUT)

## Programas usados 🛠️

- Visual Studio Code
- Mysql Workbench
- Postman
- node

## Autores

Nacho V. Bordera y David Martínez
