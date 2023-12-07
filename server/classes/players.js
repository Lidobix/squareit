import { getId } from '../utils/utils.js';
import { getAvatar } from '../utils/utils.js';
import { authModule } from './auth.js';
import { dataBaseModule } from './dataBase.js';

class Players {
  constructor() {
    this.all = [];
    this.logged = {};
  }

  player(pseudo, pwd, bScore) {
    return {
      pseudo: pseudo,
      password: pwd,
      id: getId(),
      bestScore: bScore,
      avatar: getAvatar(),
      token: authModule.creationToken(this.pseudo, this.id),
      score: 0,
      inRoom: false,
      idSocket: '',
      room: '',
    };
  }

  deleteExitedPlayer(id, socketId) {
    delete this.incomingPlayers[id];
    delete this.loggedPlayers[socketId];
  }

  async findInDb(id, pwd) {
    return dataBaseModule.findPlayer({
      pseudo: id,
      password: pwd,
    });
  }

  alreadyLogged(pseudo) {
    console.log('dans already logged');
    return this.all.filter((e) => e.pseudo === pseudo).length !== 0;
  }

  notLogged(id) {
    if (id) {
      return this.all.filter((e) => e.id === id).length === 0;
    }
  }

  create(pseudo, pwd, bScore) {
    const newPlayer = this.player(pseudo, pwd, bScore);
    this.all.push(newPlayer);
    return newPlayer;
  }

  createNew(pseudo, pwd) {
    const newPlayer = this.player(pseudo, pwd);
    this.all.push(newPlayer);
    dataBaseModule.createNewPlayer(newPlayer);
    return newPlayer;
  }

  enterInRoom(socketId) {
    this.loggedPlayers[socketId].inRoom = true;
    // this.loggedPlayers[socketId].decoSauvage = false;
  }
}

export const players = new Players();
