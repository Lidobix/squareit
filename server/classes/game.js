import { dataBaseModule } from './dataBase.js';

class Game {
  constructor() {
    this.bestScores;
  }

  loadBestScores() {
    dataBaseModule.fetchBestScores().then((scores) => {
      this.bestScores = scores;
      console.log('scores', scores);
    });
  }
}

export const game = new Game();
