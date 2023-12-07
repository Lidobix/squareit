import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import session from 'express-session';

import { constants } from './server/utils/constants.js';
import { game } from './server/classes/game.js';
import { players } from './server/classes/players.js';
import { authModule } from './server/classes/auth.js';
import { renderOptions } from './server/utils/renderOptions.js';
import { rooms } from './server/classes/rooms.js';

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

app.use('/images', express.static(path.join(dirname, 'assets/images')));
app.use('/css', express.static(path.join(dirname, 'assets/css')));
app.use('/fonts', express.static(path.join(dirname, 'assets/fonts')));
app.set('/views', express.static(path.join(dirname, 'views')));
app.use('/client', express.static(path.join(dirname, 'client')));

// SERVEUR EXPRESS

const server = httpServer.listen(process.env.PORT, () => {
  console.log(`Le serveur est démarré sur le port ${server.address().port}`);
});

// ACCUEIL

app.get('/', (req, res) => {
  game.loadBestScores();
  res.render('template.pug', renderOptions.homePage);
});

// DECONNEXION

app.post('/logout', (req, res) => {
  players.deleteExitedPlayer(
    req.session.player.id,
    req.session.player.idSocket
  );
  res.redirect('/');
});

// CONNEXION

app.post('/login', (req, res, next) => {
  const { identifiant, password } = req.body;

  authModule.isEmptyForm(identifiant, password) &&
    res.render('template.pug', renderOptions.emptyLoginForm);

  players.findInDb(identifiant, password).then((data) => {
    console.log('data', data);
    // Cas d'erreur ou utilisateur inconnu
    if (data == null) {
      res.render('template.pug', renderOptions.unknownUser);
    } else {
      // Cas de l'utilisateur inscrit avec login OK

      if (!players.alreadyLogged(identifiant)) {
        mySession(req, res, () => {
          req.session.player = players.create(
            data.pseudo,
            data.password,
            data.bestScore
          );
        });
        console.log('vers le game');
        res.redirect('/auth/game');
      } else {
        // Cas de la double connexion
        res.render('template.pug', {
          ...renderOptions.alreadyLogged,
          messageInformation: `${constants.information.alreadyLogged} ${identifiant} !!`,
        });
      }
    }
  });
});

// INSCRIPTION

app.get('/signin', (req, res) => {
  console.log("dans l'inscription");
  res.render('template.pug', renderOptions.signinPage);
});

app.post('/signin', (req, res) => {
  const { identifiant, password } = req.body;

  authModule.isEmptyForm(identifiant, password) &&
    res.render('template.pug', renderOptions.emptySigninForm);

  // On fouille dans la db pour voir si le user n'est pas déjà existant

  players.findInDb(identifiant).then((data) => {
    // L'utilisateur est inconnu, on peut l'inscrire
    if (data == null) {
      mySession(req, res, () => {
        req.session.player = players.createNew(identifiant, password);
      });
      res.redirect('auth/game');
    } else {
      // Cas de l'utiiisateur déjà inscrit
      res.render('template.pug', {
        ...renderOptions.alreadySigned,
        messageInformation: `${constants.information.alreadyRegistered}  ${identifiant} !!`,
      });
    }
  });
});

app.get('/auth/*', (req, res, next) => {
  console.log("dans l'auth");
  // On redirige vers l'accueil toute tentative de connexion en direct au jeu via l'url:

  if (
    req.session.player === undefined

    /// à améliorer avec une condition supplémentaire.

    // players.notLogged(req.session.player.id)

    // game.incomingPlayers[req.session.player.id] === undefinedc &&
    // !game.loggedPlayers[req.session.player.id]
  ) {
    console.log('retour accueil');
    res.redirect('/');
  } else {
    try {
      authModule.checkToken(req.session.player.token);
      console.log('token ok ,va jouer');
      next();
    } catch (error) {
      res.render('/404.pug');
    }
  }
});

app.get('/auth/game', (req, res) => {
  // On charge la liste des meilleurs scores:
  console.log('dans le game');

  res.render('jeu.pug', {
    ...renderOptions.gamePage,
    bestScores: game.bestScores,
    messageInformation: `${constants.information.welcome} ${req.session.player.pseudo} !!`,
  });
});

// SERVEUR SOCKET IO

const io = new Server(httpServer);

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(mySession));

io.on('connection', (socket) => {
  console.log('connecté au serveur io');
  // console.log('socket.request.session', socket.request.session);
  // console.log(
  //   'player:',
  //   players.all.filter((p) => {
  //     p.id === socket.request.session.player.id;
  //   })
  // );
  // console.log(socket.request.session);

  const thisPlayer = socket.request.session.player;

  players.logged[socket.id] = thisPlayer;
  players.logged[socket.id].idSocket = socket.id;
  console.log('LOGGED PLAYERS', players.logged);
  socket.on('openRoom', () => {
    let room = null;
    // game.loggedPlayers[socket.id].inRoom = true;
    // game.loggedPlayers[socket.id].decoSauvage = false;
    players.enterInRoom(socket.id);
    // si il n'y a pas de room créée:
    // on en créé une
    if (rooms.all.length === 0) {
      // room = creationRoom(game.loggedPlayers[socket.id]);

      room = rooms.create(players.logged[socket.id]);
      socket.join(room.id);
      return;
    } else {
      // Sinon si une room existe
      const roomsQty = rooms.all.length;
      const roomPlayersQty = rooms.all[roomsQty - 1].players.length;
      // si le nombre de joueur dans la dernière room est différent de 2
      if (roomPlayersQty != 2) {
        room = rooms.all[roomsQty - 1];
        players.logged[socket.id].idRoom = room.id;
        room.players.push(players.logged[socket.id]);
        socket.join(room.id);
      } else {
        // si le nombre de joueur dans la dernière room est de 2 (salle pleine)
        room = creationRoom(players.logged[socket.id]);
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

      io.to(room.id).emit('initGame', game.getParameters(), room);
      io.to(room.id).emit('startGame', room);

      socket.on('startCounter', () => {
        let gameDuration = 19;
        let counter = setInterval(() => {
          io.to(room.id).emit('updateCounter', gameDuration);

          if (gameDuration === 0) {
            const podium = game.checkScore(room);

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

      room = game.updateScore(room, socket.id, gain);

      io.to(room.players[0].idSocket).emit(
        'game.updateScores',
        room.players[0].score,
        room.players[1].score
      );
      io.to(room.players[1].idSocket).emit(
        'game.updateScores',
        room.players[1].score,
        room.players[0].score
      );

      // On supprime le carré:
      io.to(room.id).emit('deleteSqware', sqware.id, room);
    }
  });

  socket.on('disconnecting', () => {
    const room = Array.from(socket.rooms);

    if (players.logged[room[0]].inRoom) {
      delete players.logged[room[0]];
    }

    io.to(room[1]).emit('endGame', null, null, true);
  });
});

// ERREUR 404

app.use((req, res) => {
  res.status(404).render('404.pug');
});
