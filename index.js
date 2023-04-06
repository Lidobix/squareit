import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import expressSession from 'express-session';
import sessionFileStore from 'session-file-store';

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

const ExpressSessionFileStore = sessionFileStore(expressSession);

const fileStore = new ExpressSessionFileStore({
  path: './sessions',
  ttl: 3600,
  retrie: 10,
  secret: 'SECRET',
});

const mySession = expressSession({
  store: fileStore,
  resave: true,
  saveUninitialized: false,
  secret: 'encore un secret',
});

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
app.use(cookieParser());

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
  // mySession(req, res, () => {
  //   console.log('req.session', req.session);
  //   req.session.test = 'Bienvenue';
  //   req.session.player = 'inconnu';
  // });
  res.render('template.pug', renderOptions);
});

// DECONNEXION

app.post('/logout', (req, res) => {
  delete site.incomingPlayers[req.cookies.id];
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
            };
            player.token = creationToken(player.pseudo, player.id);
            site.incomingPlayers[player.id] = player;
            mySession(req, res, () => {
              req.session.player = player;
              console.log(`Bienvenue ${req.session.player.pseudo}`);
            });
            res
              .cookie('token', player.token)
              .cookie('pseudo', player.pseudo)
              .cookie('id', player.id)
              .cookie('bestScore', player.bestScore)
              .cookie('score', player.score)
              .cookie('avatar', player.avatar)
              .cookie('jeuEnCours', player.jeuEnCours)
              .cookie('decoSauvage', player.decoSauvage)
              .redirect('/auth/game');
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
          res
            .cookie('token', player.token)
            .cookie('pseudo', player.pseudo)
            .cookie('id', player.id)
            .cookie('bestScore', player.bestScore)
            .cookie('score', player.score)
            .cookie('avatar', player.avatar)
            .cookie('jeuEnCours', player.jeuEnCours)
            .cookie('decoSauvage', player.decoSauvage)
            .redirect('auth/game');
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
    site.incomingPlayers[req.cookies.id] === undefined &&
    !site.loggedPlayers[req.cookies.id]
  ) {
    res.redirect('/');
  } else {
    try {
      jwt.verify(req.cookies.token, process.env.SECRET);
      next();
    } catch (error) {
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
            messageInformation: `${constants.information.welcome} ${req.cookies.pseudo} !!`,
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

io.on('connection', (socket) => {
  console.log('connecté au serveur io');

  const headers = socket.request.rawHeaders;

  const cookieIndex = headers.includes('Cookie')
    ? 'Cookie'
    : headers.includes('cookie')
    ? 'cookie'
    : null;

  const cookies = headers[1 + headers.indexOf(cookieIndex)].split('; ');
  const objCookie = {};

  for (let i = 0; i < cookies.length; i++) {
    const property = cookies[i].split('=');
    switch (property[0]) {
      case 'pseudo':
        objCookie.pseudo = property[1];
        break;
      case 'id':
        objCookie.id = property[1];
        break;
      case 'token':
        objCookie.token = property[1];
        break;
      case 'bestScore':
        objCookie.bestScore = property[1];
        break;
      case 'score':
        objCookie.score = parseFloat(property[1]);
        break;
      case 'avatar':
        objCookie.avatar = property[1];
        break;
      case 'jeuEnCours':
        objCookie.jeuEnCours = property[1];
        break;
      case 'decoSauvage':
        objCookie.decoSauvage = property[1];
        break;
    }
  }

  delete site.incomingPlayers[objCookie.id];

  site.loggedPlayers[socket.id] = objCookie;
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

    delete socket.request.headers.cookie;
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
