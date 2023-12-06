import { dataBaseModule } from './dataBase.js';
import { getRandomInt, getAvatar, getColor, getId } from '../utils/utils.js';

class Game {
  constructor() {
    this.bestScores;
    this.gameParameters = {
      sqwareQty: 200,
      targetColor: getColor(),
      sqwaresToDraw: [],
      avatar: '/images/' + getAvatar(),
    };
  }

  loadBestScores() {
    dataBaseModule.fetchBestScores().then((scores) => {
      this.bestScores = scores;
      //   console.log('scores', scores);
    });
  }

  defineSqwares() {
    // const gameParameters = {
    //   sqwareQty: 200,
    //   targetColor: getColor(),
    //   sqwaresToDraw: [],
    //   avatar: '/images/' + getAvatar(),
    // };

    for (let i = 1; i < this.gameParameters.sqwareQty + 1; i++) {
      const sqware = {
        id: getId(),
        color: getColor(),
        position: 'absolute',
        width: 1 + getRandomInt(10) + 'rem',
        left: 5 + getRandomInt(80) + '%',
        top: getRandomInt(76) + '%',
        rotate: getRandomInt(360) + 'deg',
        border: '3px solid black',
      };
      this.gameParameters.sqwaresToDraw.push(sqware);
    }

    console.log(this.gameParameters);
    return this.gameParameters;
  }

  updateScore(room, socketid, points) {
    if (room.players[0].idSocket === socketid) {
      room.players[0].score = room.players[0].score + points;
    } else {
      room.players[1].score = room.players[1].score + points;
    }
    game.loggedPlayers[socketid].score =
      game.loggedPlayers[socketid].score + points;

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
