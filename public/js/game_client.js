window.document.addEventListener('DOMContentLoaded', () => {
  const socket = io('');

  const infoCouleurCible = window.document.getElementById('targetColor');
  let targetColor;
  let roomFront = [];
  let carresPresents = [];
  const gameZone = window.document.getElementById('gameZone');
  const btnPlay = window.document.getElementById('bouton_play');
  const infosJeu = window.document.getElementById('infosJeu');
  const regleDuJeu = window.document.getElementById('regleDuJeu');
  const nouvellePartie = window.document.getElementById('nouvellePartie');
  const attenteJoueur = window.document.getElementById('attenteJoueur');
  const bestScores = window.document.getElementById('bestScores');
  const avatarHaut = window.document.getElementById('avatar1');
  const avatarBas = window.document.getElementById('avatar2');
  const userHaut = window.document.getElementById('user1');
  const userBas = window.document.getElementById('user2');
  const scoreHaut = window.document.getElementById('score1');
  const scoreBas = window.document.getElementById('score2');
  const timer = window.document.getElementById('timer');
  const endWindow = window.document.getElementById('endWindow');
  const avatarWin = window.document.getElementById('avatarWin');
  const windScore = window.document.getElementById('scores');
  const scoreWinner = window.document.getElementById('winner');
  const scoreLooser = window.document.getElementById('looser');

  btnPlay.addEventListener('click', () => {
    socket.emit('openRoom');
    btnPlay.style.display = 'none';
    attenteJoueur.style.display = 'inline';
  });

  const creationCarres = (sqwareToDraw) => {
    sqwareToDraw.forEach((carre) => {
      let divCliquable = window.document.createElement('div');
      gameZone.appendChild(divCliquable);
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
      carresPresents.push(carre.id);
    });
  };

  const deleteSqware = (idCarre) => {
    const carre = window.document.getElementById(idCarre);
    gameZone.removeChild(carre);
    carresPresents.splice(carresPresents.indexOf(idCarre), 1);
  };

  const convertPath = (path) => {
    return path.replace(/%2F/g, '/');
  };
  socket.on(
    'initPlayersLabel',
    (pseudoJoueurHaut, avatarJoueurHaut, pseudoJoueurBas, avatarJoueurBas) => {
      avatarHaut.src = convertPath(avatarJoueurHaut);
      userHaut.innerText = pseudoJoueurHaut;
      avatarBas.src = convertPath(avatarJoueurBas);
      userBas.innerText = pseudoJoueurBas;
    }
  );

  socket.on('initGame', (infos) => {
    gameZone.classList.remove('masque');
    gameZone.classList.add('visible');

    creationCarres(infos.sqwaresToDraw);

    targetColor = infos.targetColor;
    infoCouleurCible.style.backgroundColor = infos.targetColor;
  });

  socket.on('startGame', (room) => {
    roomFront = room;

    bestScores.style.display = 'none';
    infosJeu.style.display = 'block';
    regleDuJeu.style.display = 'none';
    nouvellePartie.style.display = 'none';

    socket.emit('startCounter', roomFront);

    gameZone.addEventListener('click', (event) => {
      const caractCarreClique = {
        id: event.target.id,
        couleur: event.target.style.backgroundColor,
        class: event.target.className,
        cible: targetColor,
      };

      socket.emit('clickSqware', caractCarreClique, roomFront);
    });
  });

  socket.on('deleteSqware', (idCarre, room) => {
    roomFront = room;
    deleteSqware(idCarre);
  });

  socket.on('updateScores', (scoreJoueurHaut, scoreJoueurBas) => {
    scoreHaut.innerText = scoreJoueurHaut + ' Pts';
    scoreBas.innerText = scoreJoueurBas + ' Pts';
  });

  socket.on('updateCounter', (counter) => {
    timer.innerText = `${counter}s`;
  });

  socket.on('endGame', (winner, looser, deco) => {
    for (let i = 0; i < carresPresents.length; i++) {
      const divAsupprimer = window.document.getElementById(carresPresents[i]);
      gameZone.removeChild(divAsupprimer);
    }

    if (deco) {
      scoreWinner.innerText = `Votre adversaire est parti sqwarer ailleurs...\nLa victoire est à vous !`;
    } else {
      if (winner.score === looser.score) {
        scoreWinner.innerText = `Match nul ! ! ! ${winner.score} partout ! ! !`;
        windScore.removeChild(scoreLooser);
      } else {
        scoreWinner.innerText = `${winner.pseudo} gagne avec ${winner.score}pts ! ! !`;
        scoreLooser.innerText = `${looser.pseudo} . . . . ${looser.score}pts . . .`;
      }

      avatarWin.src = convertPath(winner.avatar);
    }
    endWindow.style.display = 'flex';
  });
});
