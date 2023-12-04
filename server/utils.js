import { constants } from './constants.js';

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function attributeAvatar() {
  return constants.allAvatars[getRandomInt(constants.allAvatars.length - 1)];
}
