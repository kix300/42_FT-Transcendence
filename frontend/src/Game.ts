import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Paddle } from "./Paddle";
import { Ball } from "./Ball";
import { Score } from "./Score";
import { InputHandler } from "./InputHandler";

export class Game {
  private engine: Engine;
  public scene: Scene;
  private camera: UniversalCamera;
  private light: HemisphericLight;
  private paddle1!: Paddle; // <-- Add '!'
  private paddle2!: Paddle; // <-- Add '!'
  private ball!: Ball;
  private score!: Score;
  // @ts-ignore
  private inputHandler!: InputHandler; // <-- Add '!'

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.scene = new Scene(engine);
    // Set the background color to match the image
    this.scene.clearColor = new Color4(0.22, 0.21, 0.35, 1);

    // --- CAMERA SETUP ---
    // Positioned the camera for a better top-down view of the table
    this.camera = new UniversalCamera(
      "camera1",
      new Vector3(0, 5, -30),
      this.scene,
    );
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(canvas, true);
    // *** FIX: Detach keyboard controls from the camera to prevent it from moving with arrow keys ***
    this.camera.inputs.remove(this.camera.inputs.attached.keyboard);

    this.light = new HemisphericLight(
      "light1",
      new Vector3(0, 1, 0),
      this.scene,
    );
    this.light.intensity = 0.7;

    this.createGameObjects();

    this.score = new Score(this.scene);

    // Pass the correct scoring methods to the Ball
    this.ball = new Ball(
      "ball",
      this.scene,
      () => {
        this.score.incrementPlayer2Score();
        this.ball.reset();
      },
      () => {
        this.score.incrementPlayer1Score();
        this.ball.reset();
      },
    );
    this.ball.reset();

    this.inputHandler = new InputHandler(
      this.scene,
      this.paddle1,
      this.paddle2,
    );
  }

  createGameObjects(): void {
    const tableWidth = 25;
    const tableDepth = 15;

    // Create the paddles
    this.paddle1 = new Paddle(
      "paddle1",
      new Vector3(-tableWidth / 2 + 1, 0.5, 0),
      tableDepth,
      this.scene,
    );
    this.paddle2 = new Paddle(
      "paddle2",
      new Vector3(tableWidth / 2 - 1, 0.5, 0),
      tableDepth,
      this.scene,
    );

    // Create the game table (plane)
    const table = MeshBuilder.CreateGround(
      "ground",
      { width: tableWidth, height: tableDepth },
      this.scene,
    );
    const tableMat = new StandardMaterial("groundMat", this.scene);
    tableMat.diffuseColor = new Color3(0.53, 0.58, 0.95); // Light blue color for the table
    table.material = tableMat;
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
  }

  update(): void {
    this.paddle1.update();
    this.paddle2.update();
    // Pass the table bounds and paddles for collision detection
    this.ball.update([this.paddle1.mesh, this.paddle2.mesh], {
      width: 25,
      depth: 15,
    });
  }
}
