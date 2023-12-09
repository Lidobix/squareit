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
      // idSocket: '',
      // room: '',
    };
  }

  deleteExitedPlayer(id) {
    // delete this.incomingPlayers[id];
    // console.log('id', socketId);
    console.log('ALLLLLL', this.logged);

    const index = this.logged.findIndex((player) => player.id === id);
    delete this.loggedBySocketId[this.logged[index].idSocket];
    this.logged.splice(index, 1);

    // const isPlayer = (player) => player.id === id;

    // console.log(array1.findIndex(isPlayer));
    // Expected output: 3

    // delete this.logged[this.logged.findIndex(isPlayer)];
    // const index = this.logged.findIndex((player) => player.id === id);

    // delete this.logged[index];
    // delete this.logged[this.logged.findIndex((player) => player.id === id)];
    console.log('this.logged', this.logged);
    console.log('this.loggedBySocketId', this.loggedBySocketId);

    // console.log('index', index);
    // delete this.logged[]
  }

  async findInDb(id, pwd) {
    return dataBaseModule.findPlayer({
      pseudo: id,
      password: pwd,
    });
  }

  alreadyLogged(pseudo) {
    console.log('dans already loggedBySocketId', pseudo, this.logged);

    return this.logged.filter((e) => e.pseudo === pseudo).length !== 0;
  }

  // notloggedBySocketId(id) {
  //   if (id) {
  //     return this.logged.filter((e) => e.id === id).length === 0;
  //   }
  // }

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
    // this.loggedBySocketIdPlayers[socketId].decoSauvage = false;
  }
}

export const players = new Players();
