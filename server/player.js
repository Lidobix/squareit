import { attributeAvatar } from './auth.js';
import { v4 as uuidv4 } from 'uuid';
import { creationToken } from './auth.js';

export const Player = (identifiant, pwd, bScore) => {
  pseudo = identifiant;
  password = pwd;
  id = uuidv4();
  bestScore = bScore;
  avatar = attributeAvatar();
  token = creationToken(this.pseudo, this.id);
  score = 0;
  jeuEnCours = false;
  decoSauvage = false;
  status = 'logged';
  isSocket = '';
  room = '';
};
