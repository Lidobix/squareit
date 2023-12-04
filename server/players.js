import { findPlayer, createNewPlayer } from './dbInteractions.js';
import { v4 as uuidv4 } from 'uuid';
import { creationToken } from './auth.js';
import { attributeAvatar } from './utils.js';

class Players {
  constructor() {
    this.all = [];
    this.incomingPlayers = {};
    this.loggedPlayers = {};
    this.rooms = [];
  }

  player(pseudo, pwd, bScore) {
    return {
      pseudo: pseudo,
      password: pwd,
      id: uuidv4(),
      bestScore: bScore,
      avatar: attributeAvatar(),
      token: creationToken(this.pseudo, this.id),
      score: 0,
      jeuEnCours: false,
      decoSauvage: false,
      status: 'logged',
      isSocket: '',
      room: '',
    };
  }

  deleteExitedPlayer(id, socketId) {
    delete this.incomingPlayers[id];
    delete this.loggedPlayers[socketId];
  }

  async findInDb(id, pwd) {
    return findPlayer({
      pseudo: id,
      password: pwd,
    });
  }

  alreadyLogged(pseudo) {
    console.log('dans already logged');
    return this.all.filter((e) => e.pseudo === pseudo).length !== 0;
  }

  create(pseudo, pwd, bScore) {
    const newPlayer = this.player(pseudo, pwd, bScore);
    this.all.push(newPlayer);
    return newPlayer;
  }

  createNew(pseudo, pwd) {
    const newPlayer = this.player(pseudo, pwd);
    this.all.push(newPlayer);
    createNewPlayer(newPlayer);
    return newPlayer;
  }
}

export const players = new Players();
