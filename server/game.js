class Game {
  constructor() {
    this.players = [];
    this.incomingPlayers = {};
    this.loggedPlayers = {};
    this.rooms = [];
  }

  //   deleteExitedPlayer(id, socketId) {
  //     delete this.incomingPlayers[id];
  //     delete this.loggedPlayers[socketId];
  //   }
}

export const game = new Game();
