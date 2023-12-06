import { constants } from './constants.js';
import { v4 as uuidv4 } from 'uuid';

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function attributeAvatar() {
  return constants.allAvatars[getRandomInt(constants.allAvatars.length - 1)];
}

export function getId() {
  return uuidv4();
}

export function getColor() {
  return constants.colors[getRandomInt(constants.colors.length)];
}
// Pourquoi getAvatar et attribute Avatar? on génère 2 avatars par joueur?
export function getAvatar() {
  return constants.allAvatars[getRandomInt(constants.allAvatars.length)];
}
