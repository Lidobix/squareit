import { dataBaseModule } from './dataBase.js';
import { getRandomInt, getAvatar, getColor, getId } from '../utils/utils.js';
import { players } from './players.js';

class Game {
  constructor() {
    this.bestScores;
    this.parameters = {
      sqwareQty: 200,
      targetColor: getColor(),
      sqwares: [],
    };
  }

  loadBestScores() {
    dataBaseModule.fetchBestScores().then((scores) => {
      this.bestScores = scores;
    });
  }

  getParameters() {
    for (let i = 1; i < this.parameters.sqwareQty + 1; i++) {
      this.parameters.sqwares.push({
        id: getId(),
        color: getColor(),
        position: 'absolute',
        width: 1 + getRandomInt(10) + 'rem',
        left: 5 + getRandomInt(80) + '%',
        top: getRandomInt(76) + '%',
        rotate: getRandomInt(360) + 'deg',
        border: '3px solid black',
      });
    }
    return this.parameters;
  }

  updateScore(room, socketid, points) {
    if (room.players[0].idSocket === socketid) {
      room.players[0].score = room.players[0].score + points;
    } else {
      room.players[1].score = room.players[1].score + points;
    }
    players.loggedBySocketId[socketid].score =
      players.loggedBySocketId[socketid].score + points;

    return room;
  }

  checkScore(room) {
    this.updateBestScore(room.players[0]);
    this.updateBestScore(room.players[1]);
    if (room.players[0].score === room.players[1].score) {
      room.players[0].avatar = '/images/heart.png';
      return [room.players[0], room.players[0]];
    } else {
      if (room.players[0].score > room.players[1].score) {
        return [room.players[0], room.players[1]];
      } else {
        return [room.players[1], room.players[0]];
      }
    }
  }

  updateBestScore = (player) => {
    if (player.score > player.bestScore) {
      dataBaseModule.updateBestSoreDB(player.pseudo, player.score);
    }
  };
}

export const game = new Game();
