import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import session from 'express-session';

import {
  creationToken,
  alreadyLogged,
  defineAvatar,
} from './public/modules/auth.js';
import {
  defineSqwares,
  updateScore,
  checkScore,
} from './public/modules/game_server.js';
import { constants } from './public/modules/constants.js';

const app = express();
const httpServer = createServer(app);

const mySession = session({
  resave: true,
  saveUninitialized: false,
  secret: 'encore un secret',
});

app.use(mySession);

app.use(express.urlencoded({ extended: true }));

dotenv.config();

export const mongoClient = new MongoClient(process.env.DBURL);
export const collection = mongoClient
  .db(process.env.DB)
  .collection(process.env.COLLECTION);

// Déclaration des dossiers de fichiers statiques:
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

app.set('view engine', 'pug');

app.use(cors());
// app.use(cookieParser());

app.use('/images', express.static(path.join(dirname, 'public', 'images')));
app.use('/css', express.static(path.join(dirname, 'public', 'css')));
app.use('/fonts', express.static(path.join(dirname, 'public', 'fonts')));
app.set('/views', express.static(path.join(dirname, '/views')));
app.use('/js', express.static(path.join(dirname, 'public', 'js')));

// SERVEUR EXPRESS

const server = httpServer.listen(process.env.PORT, () => {
  console.log(`Le serveur est démarré sur le port ${server.address().port}`);
});

// VARIABLES DE JEU

export const site = {
  incomingPlayers: {},
  loggedPlayers: {},
  rooms: [],
};

const renderOptions = {
  login: true,
  signin: false,
  errorLogin: false,
  emptyInput: false,
  logged: false,
  messageInformation: '',
};

// ACCUEIL

app.get('/', (req, res) => {
  res.render('template.pug', renderOptions);
});

// DECONNEXION

app.post('/logout', (req, res) => {
  // delete site.incomingPlayers[req.cookies.id];
  delete site.incomingPlayers[req.session.player.id];
  res.redirect('/');
});

// CONNEXION

app.post('/login', (req, res, next) => {
  const { identifiant, password } = req.body;

  if (identifiant == '' || password == '') {
    res.render('template.pug', {
      ...renderOptions,
      emptyInput: true,
    });
  }

  mongoClient.connect((err, client) => {
    collection.findOne(
      {
        pseudo: identifiant,
        password: password,
      },
      (err, data) => {
        // Cas d'erreur ou utilisateur inconnu
        if (null == data) {
          res.render('template.pug', {
            ...renderOptions,
            errorLogin: true,
          });
        } else {
          // Cas de l'utilisateur inscrit avec login OK
          if (!alreadyLogged(site.loggedPlayers, identifiant)) {
            const player = {
              pseudo: data.pseudo,
              id: uuidv4(),
              score: 0,
              avatar: defineAvatar(),
              bestScore: data.bestScore,
              jeuEnCours: false,
              decoSauvage: false,
              authenticated: true,
            };
            player.token = creationToken(player.pseudo, player.id);
            site.incomingPlayers[player.id] = player;
            mySession(req, res, () => {
              req.session.player = player;
              console.log(`Bienvenue ${req.session.player.pseudo}`);
            });
            res.redirect('/auth/game');
          } else {
            // Cas de la double connexion
            res.render('template.pug', {
              ...renderOptions,
              logged: true,
              messageInformation: `${constants.information.alreadyLogged} ${identifiant} !!`,
            });
          }
        }
      }
    );
    client.close;
  });
});

// INSCRIPTION

app.get('/signin', (req, res) => {
  res.render('template.pug', {
    ...renderOptions,
    login: false,
    signin: true,
  });
});

app.post('/signin', (req, res) => {
  const { identifiant, password } = req.body;

  if (identifiant == '' || password == '') {
    res.render('template.pug', {
      ...renderOptions,
      login: false,
      signin: true,
      emptyInput: true,
    });
  }
  // On fouille dans la db pour voir si le user n'est pas déjà existant
  mongoClient.connect((err, client) => {
    collection.findOne(
      {
        pseudo: identifiant,
      },
      (err, data) => {
        // L'utilisateur est inconnu, on peut l'inscrire
        if (null == data) {
          const player = {
            pseudo: identifiant,
            password: password,
            id: uuidv4(),
            avatar: defineAvatar(),
            score: 0,
            bestScore: 0,
            jeuEnCours: false,
            decoSauvage: false,
          };
          collection.insertOne(player);
          player.token = creationToken(player.pseudo, player.id);
          site.incomingPlayers[player.id] = player;
          mySession(req, res, () => {
            req.session.player = player;
            console.log(`Bienvenue ${req.session.player.pseudo}`);
          });
          res.redirect('auth/game');
        } else {
          // Cas de l'utiiisateur déjà inscrit
          res.render('template.pug', {
            ...renderOptions,
            login: false,
            signin: true,
            errorLogin: true,
            messageInformation: `${constants.information.alreadyRegistered}  ${identifiant} !!`,
          });
        }
      }
    );
    client.close;
  });
});

app.get('/auth/*', (req, res, next) => {
  // On redirige vers l'accueil toute tentative de connexion en direct au jeu via l'url:

  if (
    site.incomingPlayers[req.session.player.id] === undefined &&
    !site.loggedPlayers[req.session.player.id]
  ) {
    console.log('LOG NOK');
    res.redirect('/');
  } else {
    try {
      jwt.verify(req.session.player.token, process.env.SECRET);
      console.log('LOG OK');

      next();
    } catch (error) {
      console.log('error');
      res.render('/404.pug');
    }
  }
});

app.get('/auth/game', (req, res) => {
  // On charge la liste des meilleurs scores:
  try {
    mongoClient.connect((err, client) => {
      collection
        .find()
        .sort({
          bestScore: -1,
        })
        .limit(10)
        .toArray((err, data) => {
          res.render('jeu.pug', {
            ...renderOptions,
            logged: true,
            bestScores: data,
            messageInformation: `${constants.information.welcome} ${req.session.player.pseudo} !!`,
          });
        });
      client.close;
    });
  } catch (error) {
    console.error(error);
  }
});

// SERVEUR SOCKET IO

const io = new Server(httpServer);

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(mySession));

io.use((socket, next) => {
  console.log('socket.request.session', socket.request.session);
  const currentSession = socket.request.session;

  if (currentSession && currentSession.player.authenticated) {
    console.log('ok');
    next();
  } else {
    console.log('Nok');
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('connecté au serveur io');

  const objPlayer = socket.request.session;

  site.loggedPlayers[socket.id] = objPlayer;
  site.loggedPlayers[socket.id].idSocket = socket.id;

  socket.on('openRoom', () => {
    let room = null;
    site.loggedPlayers[socket.id].jeuEnCours = true;
    site.loggedPlayers[socket.id].decoSauvage = false;

    // si il n'y a pas de room créée:
    // on en créé une
    if (site.rooms.length === 0) {
      room = creationRoom(site.loggedPlayers[socket.id]);
      socket.join(room.id);
      return;
    } else {
      // Sinon si une room existe
      const roomsQty = site.rooms.length;
      const roomPlayersQty = site.rooms[roomsQty - 1].players.length;
      // si le nombre de joueur dans la dernière room est différent de 2
      if (roomPlayersQty != 2) {
        room = site.rooms[roomsQty - 1];
        site.loggedPlayers[socket.id].idRoom = room.id;
        room.players.push(site.loggedPlayers[socket.id]);
        socket.join(room.id);
      } else {
        // si le nombre de joueur dans la dernière room est de 2 (salle pleine)
        room = creationRoom(site.loggedPlayers[socket.id]);
        socket.join(room.id);
      }
    }

    if (room.players.length === 2) {
      console.log(room.players[0], room.players[1]);
      io.to(room.players[0].idSocket).emit(
        'initPlayersLabel',
        room.players[0],
        room.players[1]
      );
      io.to(room.players[1].idSocket).emit(
        'initPlayersLabel',
        room.players[1],
        room.players[0]
      );

      io.to(room.id).emit('initGame', defineSqwares(), room);
      io.to(room.id).emit('startGame', room);

      socket.on('startCounter', () => {
        let gameDuration = 19;
        let counter = setInterval(() => {
          io.to(room.id).emit('updateCounter', gameDuration);

          if (gameDuration === 0) {
            const podium = checkScore(room);

            io.to(room.id).emit('endGame', podium[0], podium[1], false);
            clearInterval(counter);
          }
          gameDuration--;
        }, 1000);
      });
    }
  });

  socket.on('clickSqware', (sqware, room) => {
    if (sqware.class === 'clickable') {
      const gain = sqware.color === sqware.target ? 5 : -2;

      room = updateScore(room, socket.id, gain);

      io.to(room.players[0].idSocket).emit(
        'updateScores',
        room.players[0].score,
        room.players[1].score
      );
      io.to(room.players[1].idSocket).emit(
        'updateScores',
        room.players[1].score,
        room.players[0].score
      );

      // On supprime le carré:
      io.to(room.id).emit('deleteSqware', sqware.id, room);
    }
  });

  socket.on('disconnecting', () => {
    const room = Array.from(socket.rooms);

    if (site.loggedPlayers[room[0]].jeuEnCours) {
      delete site.loggedPlayers[room[0]];
    }

    io.to(room[1]).emit('endGame', null, null, true);
  });
});

const creationRoom = (player) => {
  player.idRoom = uuidv4();
  const room = { id: player.idRoom, players: [] };
  room.players.push(player);
  site.rooms.push(room);
  return room;
};

// ERREUR 404

app.use(function (req, res) {
  res.status(404).render('404.pug');
});
