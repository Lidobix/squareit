window.document.addEventListener('DOMContentLoaded', () => {
  const socket = io('');

  const game = {
    targetColorInformation: window.document.getElementById('targetColor'),
    zone: window.document.getElementById('gameZone'),
    btnPlay: window.document.getElementById('bouton_play'),
    infosJeu: window.document.getElementById('infosJeu'),
    regleDuJeu: window.document.getElementById('regleDuJeu'),
    nouvellePartie: window.document.getElementById('nouvellePartie'),
    attenteJoueur: window.document.getElementById('attenteJoueur'),
    bestScores: window.document.getElementById('bestScores'),
    avatarHaut: window.document.getElementById('avatar1'),
    avatarBas: window.document.getElementById('avatar2'),
    userHaut: window.document.getElementById('user1'),
    userBas: window.document.getElementById('user2'),
    scoreHaut: window.document.getElementById('score1'),
    scoreBas: window.document.getElementById('score2'),
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

  game.btnPlay.addEventListener('click', () => {
    socket.emit('openRoom');
    game.btnPlay.style.display = 'none';
    game.attenteJoueur.style.display = 'inline';
  });

  const creationCarres = (sqwareToDraw) => {
    sqwareToDraw.forEach((carre) => {
      let divCliquable = window.document.createElement('div');
      game.zone.appendChild(divCliquable);
      divCliquable.classList.add('clickable');
      divCliquable.id = carre.id;
      divCliquable.style.position = carre.position;
      divCliquable.style.width = carre.width;
      divCliquable.style.height = carre.width;
      divCliquable.style.top = carre.top;
      divCliquable.style.left = carre.left;
      divCliquable.style.backgroundColor = carre.color;
      divCliquable.style.transform = `rotate(${carre.rotate}`;
      divCliquable.style.border = carre.border;
      game.displayedSqwuares.push(carre.id);
    });
  };

  const deleteSqware = (idCarre) => {
    const carre = window.document.getElementById(idCarre);
    game.zone.removeChild(carre);
    game.displayedSqwuares.splice(game.displayedSqwuares.indexOf(idCarre), 1);
  };

  const convertPath = (path) => {
    return path.replace(/%2F/g, '/');
  };

  socket.on('initPlayersLabel', (playerOne, playerTwo) => {
    game.avatarHaut.src = convertPath(playerOne.avatar);
    game.userHaut.innerText = playerOne.pseudo;
    game.avatarBas.src = convertPath(playerTwo.avatar);
    game.userBas.innerText = playerTwo.pseudo;
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
    game.infosJeu.style.display = 'block';
    game.regleDuJeu.style.display = 'none';
    game.nouvellePartie.style.display = 'none';

    socket.emit('startCounter');

    game.zone.addEventListener('click', (event) => {
      const caractCarreClique = {
        id: event.target.id,
        color: event.target.style.backgroundColor,
        class: event.target.className,
        target: game.targetColor,
      };

      socket.emit('clickSqware', caractCarreClique, game.thisRoom);
    });
  });

  socket.on('deleteSqware', (idCarre, room) => {
    game.thisRoom = room;
    deleteSqware(idCarre);
  });

  socket.on('updateScores', (scorePlayerOne, scorePlayerTwo) => {
    game.scoreHaut.innerText = scorePlayerOne + ' Pts';
    game.scoreBas.innerText = scorePlayerTwo + ' Pts';
  });

  socket.on('updateCounter', (counter) => {
    game.timer.innerText = `${counter}s`;
  });

  socket.on('endGame', (winner, looser, deco) => {
    for (let i = 0; i < game.displayedSqwuares.length; i++) {
      const divAsupprimer = window.document.getElementById(
        game.displayedSqwuares[i]
      );
      game.zone.removeChild(divAsupprimer);
    }

    if (deco) {
      game.scoreWinner.innerText = `Votre adversaire est parti sqwarer ailleurs...\nLa victoire est à vous !`;
    } else {
      if (winner.score === looser.score) {
        game.scoreWinner.innerText = `Match nul ! ! ! ${winner.score} partout ! ! !`;
        game.windScore.removeChild(scoreLooser);
      } else {
        game.scoreWinner.innerText = `${winner.pseudo} gagne avec ${winner.score}pts ! ! !`;
        game.scoreLooser.innerText = `${looser.pseudo} . . . . ${looser.score}pts . . .`;
      }

      game.avatarWin.src = convertPath(winner.avatar);
    }
    game.endWindow.style.display = 'flex';
  });
});
