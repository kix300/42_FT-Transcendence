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
  private paddle1!: Paddle;
  private paddle2!: Paddle;
  private paddle3?: Paddle;
  private ball!: Ball;
  private score!: Score;
  // @ts-expect-error
  private inputHandler!: InputHandler;
  private isThreePlayerMode = false;
  private table?: any;
  private triangleVertices?: { v1: Vector3; v2: Vector3; v3: Vector3 };

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.22, 0.21, 0.35, 1);

    this.camera = new UniversalCamera("camera1", new Vector3(0, 10, -30), this.scene);
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(canvas, true);
    this.camera.inputs.remove(this.camera.inputs.attached.keyboard);

    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    this.createGameObjects();
    this.score = new Score(this.scene);
    this.ball = new Ball("ball", this.scene,
      () => { this.score.incrementPlayer1Score(); this.ball.reset(); },
      () => { this.score.incrementPlayer2Score(); this.ball.reset(); }
    );
    this.ball.reset();
    this.inputHandler = new InputHandler(this.scene, this.paddle1, this.paddle2);
  }

  createGameObjects(): void {
    const w = 25, d = 15;
    this.paddle1 = new Paddle("paddle1", new Vector3(-w / 2 + 1, 0.5, 0), d, this.scene);
    this.paddle2 = new Paddle("paddle2", new Vector3(w / 2 - 1, 0.5, 0), d, this.scene);
    this.table = MeshBuilder.CreateGround("ground", { width: w, height: d }, this.scene);
    const mat = new StandardMaterial("groundMat", this.scene);
    mat.diffuseColor = new Color3(0.53, 0.58, 0.95);
    this.table.material = mat;
  }

  createTriangularGameObjects(): void {
    const r = 20;
    const a1 = Math.PI / 2, a2 = a1 + 2 * Math.PI / 3, a3 = a2 + 2 * Math.PI / 3;
    const v1 = new Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r);
    const v2 = new Vector3(Math.cos(a2) * r, 0, Math.sin(a2) * r);
    const v3 = new Vector3(Math.cos(a3) * r, 0, Math.sin(a3) * r);

    this.table = MeshBuilder.CreateDisc("triangleTable", { radius: r, tessellation: 3 }, this.scene);
    this.table.rotation.x = Math.PI / 2;
    this.table.rotation.y = Math.PI / 6; // Align disc triangle with calculated vertices
    const mat = new StandardMaterial("triangleTableMat", this.scene);
    mat.diffuseColor = new Color3(0.53, 0.58, 0.95);
    mat.backFaceCulling = false;
    this.table.material = mat;

    const mid = (a: Vector3, b: Vector3) => new Vector3((a.x + b.x) / 2, 0.5, (a.z + b.z) / 2);
    const edgeLen = v1.subtract(v2).length();

    this.paddle1 = new Paddle("paddle1", mid(v1, v3), edgeLen, this.scene, v1, v3);
    // this.paddle1.mesh.rotation.y = Math.atan2(v3.z - v1.z, v3.x - v1.x) + Math.PI / 2;
    this.paddle1.mesh.rotation.y = 2.6;

    this.paddle2 = new Paddle("paddle2", mid(v2, v1), edgeLen, this.scene, v2, v1);
    // this.paddle2.mesh.rotation.y = Math.atan2(v1.z - v2.z, v1.x - v2.x) + Math.PI / 2;
    this.paddle2.mesh.rotation.y = -2.6;

    this.paddle3 = new Paddle("paddle3", mid(v3, v2), edgeLen, this.scene, v3, v2);
    this.paddle3.mesh.rotation.y = Math.atan2(v2.z - v3.z, v2.x - v3.x) + Math.PI / 2;

    this.triangleVertices = { v1, v2, v3 };
  }

  public switchToThreePlayerMode(): void {
    this.isThreePlayerMode = true;
    this.cleanupGameObjects();
    this.createTriangularGameObjects();
    this.score.setThreePlayerMode(true);

    this.ball.dispose();
    this.ball = new Ball("ball", this.scene,
      () => { this.score.incrementPlayer2Score(); this.ball.reset(); },
      () => { this.score.incrementPlayer3Score(); this.ball.reset(); },
      () => { this.score.incrementPlayer1Score(); this.ball.reset(); },
      this.triangleVertices
    );
    this.ball.reset();
    this.inputHandler = new InputHandler(this.scene, this.paddle1, this.paddle2, this.paddle3);
  }

  public switchToTwoPlayerMode(): void {
    this.isThreePlayerMode = false;
    this.cleanupGameObjects();
    this.createGameObjects();
    this.score.setThreePlayerMode(false);

    this.ball.dispose();
    this.ball = new Ball("ball", this.scene,
      () => { this.score.incrementPlayer2Score(); this.ball.reset(); },
      () => { this.score.incrementPlayer1Score(); this.ball.reset(); }
    );
    this.ball.reset();
    this.inputHandler = new InputHandler(this.scene, this.paddle1, this.paddle2);
  }

  private cleanupGameObjects(): void {
    if (this.paddle1) this.paddle1.mesh.dispose();
    if (this.paddle2) this.paddle2.mesh.dispose();
    if (this.paddle3) this.paddle3.mesh.dispose();
    if (this.table) this.table.dispose();
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
    if (this.paddle3) this.paddle3.update();

    const paddles = this.isThreePlayerMode && this.paddle3
      ? [this.paddle1.mesh, this.paddle2.mesh, this.paddle3.mesh]
      : [this.paddle1.mesh, this.paddle2.mesh];

    const tableConfig = this.isThreePlayerMode
      ? { width: 30, depth: 30, isTriangular: true, radius: 15 }
      : { width: 25, depth: 15 };

    this.ball.update(paddles, tableConfig);
  }
}
