import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

export class Score {
  private player1Score: number = 0;
  private player2Score: number = 0;
  private scoreText: TextBlock;

  // @ts-ignore
  constructor(scene: Scene) {
    const adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.scoreText = new TextBlock();
    this.scoreText.text = "0 - 0";
    this.scoreText.color = "white";
    this.scoreText.fontSize = 60; // Slightly larger font
    this.scoreText.top = "20px"; // Position from the top
    this.scoreText.verticalAlignment = 0; // Align to top
    adt.addControl(this.scoreText);
  }

  public incrementPlayer1Score(): void {
    this.player1Score++;
    this.updateScoreText();
  }

  public incrementPlayer2Score(): void {
    this.player2Score++;
    this.updateScoreText();
  }

  private updateScoreText(): void {
    this.scoreText.text = `${this.player1Score} - ${this.player2Score}`;
  }
}
