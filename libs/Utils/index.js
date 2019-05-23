function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function getShuffledArray() {
  return shuffle([0, 1, 2, 3]);
}

function getNewRoomId() {
  return Math.floor(Math.random() * 9000 + 1000);
}

function getRoomReadyForSending(room) {
  const { intervalIdCountdown, intervalIdRound, ...dataToSend } = room;
  return dataToSend;
}

module.exports = {
  getShuffledArray,
  getNewRoomId,
  getRoomReadyForSending
};
