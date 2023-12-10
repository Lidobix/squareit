import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getId() {
  return uuidv4();
}

export function getColor() {
  return constants.colors[getRandomInt(constants.colors.length)];
}

export function getAvatar() {
  return constants.allAvatars[getRandomInt(constants.allAvatars.length)];
}
