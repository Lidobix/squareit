import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import session from 'express-session';
import { NewPlayer, Player } from './public/modules/player.js';
import {
  createNewPlayer,
  fetchBestScores,
  findPlayer,
} from './public/modules/dbInteractions.js';
import { alreadyLogged } from './public/modules/auth.js';
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

// Déclaration des dossiers de fichiers statiques:
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

app.set('view engine', 'pug');

app.use(cors());

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

export const game = {
  players: [],
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
  delete game.incomingPlayers[req.session.player.id];
  console.log('req.session.player.idSocke', req.session.player);
  console.log('game.loggedPlayers', game.loggedPlayers);
  delete game.loggedPlayers[req.session.player.idSocket];

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

  findPlayer({
    pseudo: identifiant,
    password: password,
  }).then((data) => {
    // Cas d'erreur ou utilisateur inconnu
    if (null == data) {
      res.render('template.pug', {
        ...renderOptions,
        errorLogin: true,
      });
    } else {
      // Cas de l'utilisateur inscrit avec login OK

      // if (!alreadyLogged(game.loggedPlayers, identifiant)) {
      if (!alreadyLogged(game.players, identifiant)) {
        const player = new Player(data.pseudo, data.password, data.bestScore);
        console.log('player=', player);
        game.players.push(player);

        // console.log('game Players', game.players);
        // game.incomingPlayers[player.id] = player;

        mySession(req, res, () => {
          req.session.player = player;
        });
        console.log('vers le game');
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

  findPlayer({
    pseudo: identifiant,
  }).then((data) => {
    // L'utilisateur est inconnu, on peut l'inscrire
    if (null == data) {
      const player = new Player(identifiant);
      createNewPlayer(new NewPlayer(identifiant, password));
      game.players.push(player);
      // game.incomingPlayers[player.id] = player;
      mySession(req, res, () => {
        req.session.player = player;
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
  });
});

app.get('/auth/*', (req, res, next) => {
  console.log("dans l'auth");
  // On redirige vers l'accueil toute tentative de connexion en direct au jeu via l'url:
  console.log(game.players);
  console.log(req.session.player.id);
  console.log(
    game.players.filter((e) => e.id === req.session.player.id)[0].status
  );
  if (
    game.players.filter((e) => e.id === req.session.player.id).length === 0
    // game.incomingPlayers[req.session.player.id] === undefinedc &&
    // !game.loggedPlayers[req.session.player.id]
  ) {
    console.log('retour accueil');
    res.redirect('/');
  } else {
    try {
      jwt.verify(req.session.player.token, process.env.SECRET);
      console.log('va jouer');
      next();
    } catch (error) {
      res.render('/404.pug');
    }
  }
});

app.get('/auth/game', (req, res) => {
  // On charge la liste des meilleurs scores:
  console.log('dans le game');
  fetchBestScores().then((data) => {
    res.render('jeu.pug', {
      ...renderOptions,
      logged: true,
      bestScores: data,
      messageInformation: `${constants.information.welcome} ${req.session.player.pseudo} !!`,
    });
  });
});

// SERVEUR SOCKET IO

const io = new Server(httpServer);

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(mySession));

io.on('connection', (socket) => {
  console.log('connecté au serveur io');
  console.log('socket.request.session', socket.request.session);
  console.log(
    'player:',
    game.players.filter((p) => {
      p.id === socket.request.session.player.id;
    })
  );
  // console.log(socket.request.session);

  // const thisPlayer = socket.request.session.player;

  // game.loggedPlayers[socket.id] = thisPlayer;
  // game.loggedPlayers[socket.id].idSocket = socket.id;

  socket.on('openRoom', () => {
    let room = null;
    game.loggedPlayers[socket.id].jeuEnCours = true;
    game.loggedPlayers[socket.id].decoSauvage = false;

    // si il n'y a pas de room créée:
    // on en créé une
    if (game.rooms.length === 0) {
      room = creationRoom(game.loggedPlayers[socket.id]);
      socket.join(room.id);
      return;
    } else {
      // Sinon si une room existe
      const roomsQty = game.rooms.length;
      const roomPlayersQty = game.rooms[roomsQty - 1].players.length;
      // si le nombre de joueur dans la dernière room est différent de 2
      if (roomPlayersQty != 2) {
        room = game.rooms[roomsQty - 1];
        game.loggedPlayers[socket.id].idRoom = room.id;
        room.players.push(game.loggedPlayers[socket.id]);
        socket.join(room.id);
      } else {
        // si le nombre de joueur dans la dernière room est de 2 (salle pleine)
        room = creationRoom(game.loggedPlayers[socket.id]);
        socket.join(room.id);
      }
    }

    if (room.players.length === 2) {
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

    if (game.loggedPlayers[room[0]].jeuEnCours) {
      delete game.loggedPlayers[room[0]];
    }

    io.to(room[1]).emit('endGame', null, null, true);
  });
});

const creationRoom = (player) => {
  player.idRoom = uuidv4();
  const room = { id: player.idRoom, players: [] };
  room.players.push(player);
  game.rooms.push(room);
  return room;
};

// ERREUR 404

app.use(function (req, res) {
  res.status(404).render('404.pug');
});
