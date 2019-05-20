module.exports = function Room() {
  this.isPlayerInRoom = uid => {
    console.log(this.teamsArray);
    return this.teamsArray
      .map(team =>
        this.teams[team]
          .map(player => {
            return player.id === uid;
          })
          .includes(true)
      )
      .includes(true);
  };

  this.resetCurrentChoice = () => {
    this.currentChoice = this.currentChoiceCopy;
  };
  this.resetTeamsThatHaveSubmitted = () => {
    this.teamsThatHaveSubmitted = [];
  };
  this.haveAllTeamsSubmitted = () => {
    return this.teamsThatHaveSubmitted.length === this.teamsArray.length;
  };
  this.hasTeamSubmitted = team => {
    return (
      this.currentChoice[team][1].length === 1 &&
      this.currentChoice[team][2].length === 1 &&
      this.currentChoice[team][3].length === 1 &&
      this.currentChoice[team][4].length === 1
    );
  };
};
