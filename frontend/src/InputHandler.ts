import { Scene, ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import { Paddle } from './Paddle';

export class InputHandler {
    private scene: Scene;
    private paddle1: Paddle;
    private paddle2: Paddle;
    private paddle3?: Paddle;
    private inputMap: any = {};

    constructor(scene: Scene, paddle1: Paddle, paddle2: Paddle, paddle3?: Paddle) {
        this.scene = scene;
        this.paddle1 = paddle1; // Left paddle
        this.paddle2 = paddle2; // Right paddle
        this.paddle3 = paddle3; // Optional third paddle
        this.setupInput();
    }

    private setupInput(): void {
        this.scene.actionManager = new ActionManager(this.scene);

        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
                this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
            })
        );

        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
                this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
            })
        );


        this.scene.onBeforeRenderObservable.add(() => {
            // Player 1 (Left Paddle): 'w' and 's'
            if (this.inputMap['w']) {
                this.paddle2.moveNegativeZ(); // Move "up" the screen
            } else if (this.inputMap['s']) {
                this.paddle2.movePositiveZ(); // Move "down" the screen
            } else {
                this.paddle2.stop();
            }

            // Player 2 (Right Paddle): Arrow keys
            if (this.inputMap['ArrowUp']) {
                this.paddle1.moveNegativeZ();
            } else if (this.inputMap['ArrowDown']) {
                this.paddle1.movePositiveZ();
            } else {
                this.paddle1.stop();
            }

            // Player 3 (Third Paddle): 'a' and 'd' keys for left/right movement
            if (this.paddle3) {
                if (this.inputMap['k']) {
                    this.paddle3.movePositiveZ();
                } else if (this.inputMap['j']) {
                    this.paddle3.moveNegativeZ();
                } else {
                    this.paddle3.stop();
                }
            }
        });
    }
}
