import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { game } from '../../index.js';
import { updateBestSoreDB } from './dbInteractions.js';
dotenv.config();

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function defineSqwares() {
  const gameParameters = {
    sqwareQty: 200,
    targetColor: constants.colors[getRandomInt(constants.colors.length)],
    sqwaresToDraw: [],
    avatar:
      '/images/' +
      constants.allAvatars[getRandomInt(constants.allAvatars.length)],
  };

  for (let i = 1; i < gameParameters.sqwareQty + 1; i++) {
    const sqware = {
      id: uuidv4(),
      color: constants.colors[getRandomInt(constants.colors.length)],
      position: 'absolute',
      width: 1 + getRandomInt(10) + 'rem',
      left: 5 + getRandomInt(80) + '%',
      top: getRandomInt(76) + '%',
      rotate: getRandomInt(360) + 'deg',
      border: '3px solid black',
    };
    gameParameters.sqwaresToDraw.push(sqware);
  }
  return gameParameters;
}

export function updateScore(room, socketid, points) {
  if (room.players[0].idSocket === socketid) {
    room.players[0].score = room.players[0].score + points;
  } else {
    room.players[1].score = room.players[1].score + points;
  }
  game.loggedPlayers[socketid].score =
    game.loggedPlayers[socketid].score + points;

  return room;
}

export function checkScore(room) {
  updateBestScore(room.players[0]);
  updateBestScore(room.players[1]);
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

const updateBestScore = (player) => {
  if (player.score > player.bestScore) {
    updateBestSoreDB(player.pseudo, player.score);
  }
};
