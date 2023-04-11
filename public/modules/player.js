import { defineAvatar } from './auth.js';
import { v4 as uuidv4 } from 'uuid';
import { creationToken } from './auth.js';

export class NewPlayer {
  constructor(identifiant, password, bestScore) {
    this.pseudo = identifiant;
    this.password = password;
    this.id = uuidv4();
    this.bestScore = bestScore;
  }
}

export class Player extends NewPlayer {
  constructor(identifiant, password, bestScore) {
    super(identifiant, password, bestScore);
    this.avatar = defineAvatar();
    this.token = creationToken(this.pseudo, this.id);
    this.score = 0;
    this.jeuEnCours = false;
    this.decoSauvage = false;
  }
}
