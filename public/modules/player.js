import { defineAvatar } from './auth.js';
import { v4 as uuidv4 } from 'uuid';
import { creationToken } from './auth.js';

export class NewPlayer {
  constructor(identifiant, password) {
    this.pseudo = identifiant;
    this.password = password;
    this.id = uuidv4();
    this.bestScore = 0;
  }
}

export class Player extends NewPlayer {
  constructor(identifiant, bestScore) {
    super(identifiant, bestScore);
    this.avatar = defineAvatar();
    this.token = creationToken(this.pseudo, this.id);
    this.score = 0;
    this.jeuEnCours = false;
    this.decoSauvage = false;
  }
}
