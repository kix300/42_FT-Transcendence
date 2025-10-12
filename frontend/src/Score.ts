import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

export class Score {
  private player1Score: number = 0;
  private player2Score: number = 0;
  private player3Score: number = 0;
  private scoreText: TextBlock;
  private isThreePlayerMode: boolean = false;

  // @ts-ignore
  constructor(scene: Scene) {
    const adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.scoreText = new TextBlock();
    this.scoreText.text = "0 - 0";
    this.scoreText.color = "white";
    this.scoreText.fontSize = 60; // Slightly larger font
    this.scoreText.top = "-300px"; // Position from the top
    this.scoreText.verticalAlignment = 0; // Align to top
    adt.addControl(this.scoreText);
  }

  public setThreePlayerMode(enabled: boolean): void {
    this.isThreePlayerMode = enabled;
    this.reset();
  }

  public incrementPlayer1Score(): void {
    this.player1Score++;
    this.updateScoreText();
  }

  public incrementPlayer2Score(): void {
    this.player2Score++;
    this.updateScoreText();
  }

  public incrementPlayer3Score(): void {
    this.player3Score++;
    this.updateScoreText();
  }

  public getPlayer1Score(): number {
    return this.player1Score;
  }

  public getPlayer2Score(): number {
    return this.player2Score;
  }

  public getPlayer3Score(): number {
    return this.player3Score;
  }

  public hasWinner(winningScore: number = 7): boolean {
    return this.player1Score >= winningScore ||
           this.player2Score >= winningScore;
  }

  public getWinner(winningScore: number = 7): number {
    if (this.player1Score >= winningScore) return 1;
    if (this.player2Score >= winningScore) return 2;
    return 0; // No winner yet
  }

  public reset(): void {
    this.player1Score = 0;
    this.player2Score = 0;
    this.player3Score = 0;
    this.updateScoreText();
  }

  private updateScoreText(): void {
    if (this.isThreePlayerMode) {
      this.scoreText.text = `${this.player1Score} - ${this.player2Score} - ${this.player3Score}`;
    } else {
      this.scoreText.text = `${this.player1Score} - ${this.player2Score}`;
    }
  }
}
