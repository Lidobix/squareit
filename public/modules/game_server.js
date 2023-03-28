import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function defineSqwares() {
  const sqwareList = {};
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
    sqwareList[sqware.id] = sqware;
  }
  return gameParameters;
}
