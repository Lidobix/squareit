import { getId } from '../utils/utils.js';
import { getAvatar } from '../utils/utils.js';
import { authModule } from './auth.js';
import { dataBaseModule } from './dataBase.js';

class Players {
  constructor() {
    this.logged = [];
    this.loggedBySocketId = {};
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
    };
  }

  deleteExitedPlayer(id) {
    const index = this.logged.findIndex((player) => player.id === id);

    this.logged.splice(index, 1);
  }

  async findInDb(id, pwd) {
    return dataBaseModule.findPlayer({
      pseudo: id,
      password: pwd,
    });
  }

  alreadyLogged(pseudo) {
    return this.logged.filter((e) => e.pseudo === pseudo).length !== 0;
  }

  create(pseudo, pwd, bScore) {
    const newPlayer = this.player(pseudo, pwd, bScore);
    this.logged.push(newPlayer);
    return newPlayer;
  }

  createNew(pseudo, pwd) {
    const newPlayer = this.player(pseudo, pwd);
    this.logged.push(newPlayer);
    dataBaseModule.createNewPlayer(newPlayer);
    return newPlayer;
  }

  enterInRoom(socketId) {
    this.loggedBySocketId[socketId].inRoom = true;
  }
}

export const players = new Players();
