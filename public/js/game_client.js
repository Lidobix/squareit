window.document.addEventListener('DOMContentLoaded', () => {
  const socket = io('');

  const game = {
    targetColorInformation: window.document.getElementById('targetColor'),
    zone: window.document.getElementById('gameZone'),
    joinButton: window.document.getElementById('joinButton'),
    infoPanel: window.document.getElementById('infoPanel'),
    rules: window.document.getElementById('rules'),
    newGameWindow: window.document.getElementById('newGameWindow'),
    wiatingPlayerText: window.document.getElementById('wiatingPlayerText'),
    bestScores: window.document.getElementById('bestScores'),
    topAvatar: window.document.getElementById('topAvatar'),
    bottomAvatar: window.document.getElementById('bottomAvatar'),
    topPlayer: window.document.getElementById('topPlayer'),
    bottomPlayer: window.document.getElementById('bottomPlayer'),
    topScore: window.document.getElementById('topScore'),
    bottomScore: window.document.getElementById('bottomScore'),
    timer: window.document.getElementById('timer'),
    endWindow: window.document.getElementById('endWindow'),
    avatarWin: window.document.getElementById('avatarWin'),
    windScore: window.document.getElementById('scores'),
    scoreWinner: window.document.getElementById('winner'),
    scoreLooser: window.document.getElementById('looser'),
    targetColor: '',
    thisRoom: [],
    displayedSqwuares: [],
  };

  game.joinButton.addEventListener('click', () => {
    socket.emit('openRoom');
    game.joinButton.style.display = 'none';
    game.wiatingPlayerText.style.display = 'inline';
  });

  const creationCarres = (sqwareToDraw) => {
    sqwareToDraw.forEach((element) => {
      let newSqware = window.document.createElement('div');
      newSqware.id = element.id;
      newSqware.style.position = element.position;
      newSqware.style.width = element.width;
      newSqware.style.height = element.width;
      newSqware.style.top = element.top;
      newSqware.style.left = element.left;
      newSqware.style.backgroundColor = element.color;
      newSqware.style.transform = `rotate(${element.rotate}`;
      newSqware.style.border = element.border;
      newSqware.classList.add('clickable');
      game.zone.appendChild(newSqware);
      game.displayedSqwuares.push(element.id);
    });
  };

  const deleteSqware = (sqwareId) => {
    const sqwareToDelete = window.document.getElementById(sqwareId);
    game.zone.removeChild(sqwareToDelete);
    game.displayedSqwuares.splice(game.displayedSqwuares.indexOf(sqwareId), 1);
  };

  const convertPath = (path) => {
    return path.replace(/%2F/g, '/');
  };

  socket.on('initPlayersLabel', (playerOne, playerTwo) => {
    console.log('playerOne', playerOne);
    console.log('playerTwo', playerTwo);

    game.topAvatar.src = convertPath(playerOne.avatar);
    game.topPlayer.innerText = playerOne.pseudo;
    game.bottomAvatar.src = convertPath(playerTwo.avatar);
    game.bottomPlayer.innerText = playerTwo.pseudo;
  });

  socket.on('initGame', (infos) => {
    game.zone.classList.remove('hidden');
    game.zone.classList.add('visible');

    creationCarres(infos.sqwaresToDraw);

    game.targetColor = infos.targetColor;
    game.targetColorInformation.style.backgroundColor = infos.targetColor;
  });

  socket.on('startGame', (room) => {
    game.thisRoom = room;

    game.bestScores.style.display = 'none';
    game.infoPanel.style.display = 'block';
    game.rules.style.display = 'none';
    game.newGameWindow.style.display = 'none';

    socket.emit('startCounter');

    game.zone.addEventListener('click', (event) => {
      const clickedSqware = {
        id: event.target.id,
        color: event.target.style.backgroundColor,
        class: event.target.className,
        target: game.targetColor,
      };

      socket.emit('clickSqware', clickedSqware, game.thisRoom);
    });
  });

  socket.on('deleteSqware', (sqwareId, room) => {
    game.thisRoom = room;
    deleteSqware(sqwareId);
  });

  socket.on('updateScores', (scorePlayerOne, scorePlayerTwo) => {
    game.topScore.innerText = scorePlayerOne + ' Pts';
    game.bottomScore.innerText = scorePlayerTwo + ' Pts';
  });

  socket.on('updateCounter', (counter) => {
    game.timer.innerText = `${counter}s`;
  });

  socket.on('endGame', (winner, looser, deco) => {
    for (let i = 0; i < game.displayedSqwuares.length; i++) {
      const remainingSqware = window.document.getElementById(
        game.displayedSqwuares[i]
      );
      game.zone.removeChild(remainingSqware);
    }

    if (deco) {
      game.scoreWinner.innerText = `Votre adversaire est parti sqwarer ailleurs...\nLa victoire est à vous !`;
    } else {
      if (winner.score === looser.score) {
        game.scoreWinner.innerText = `Match nul ! ! ! ${winner.score} partout ! ! !`;
      } else {
        game.scoreWinner.innerText = `${winner.pseudo} gagne avec ${winner.score}pts ! ! !`;
        game.scoreLooser.innerText = `${looser.pseudo} . . . . ${looser.score}pts . . .`;
      }

      game.avatarWin.src = convertPath(winner.avatar);
    }
    game.endWindow.style.display = 'flex';
  });
});
