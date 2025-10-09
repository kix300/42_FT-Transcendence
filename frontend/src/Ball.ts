import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class Ball {
    public mesh: Mesh;
    private velocity: Vector3 = Vector3.Zero();
    private speed: number = 0.1;
    private onLeftGoal: () => void;
    private onRightGoal: () => void;
    // @ts-expect-error - onBottomGoal is used for 3-player mode scoring
    private onBottomGoal?: () => void;

    constructor(name: string, scene: Scene, onLeftGoal: () => void, onRightGoal: () => void, onBottomGoal?: () => void) {
        this.mesh = MeshBuilder.CreateSphere(name, { diameter: 0.8 }, scene);
        this.mesh.position.y = 0.4; // slightly above the table
        this.onLeftGoal = onLeftGoal;
        this.onRightGoal = onRightGoal;
        this.onBottomGoal = onBottomGoal;

        const material = new StandardMaterial(name + 'Mat', scene);
        material.diffuseColor = Color3.Red(); // Red ball here
        this.mesh.material = material;
    }

    public dispose(): void {
        this.mesh.dispose();
    }

    public reset(): void {
        this.mesh.position.x = 0;
        this.mesh.position.z = 0;

        // Random direction toward left (-1) or right (1) player
        const direction = Math.random() > 0.5 ? 1 : -1;
        // between 10-45 degrees
        const angle = (Math.random() * Math.PI / 6) + (Math.PI / 18);

        this.velocity.x = direction * Math.cos(angle) * this.speed;
        this.velocity.z = Math.sin(angle) * this.speed * (Math.random() > 0.5 ? 1 : -1);
        this.velocity.y = 0; // no vertical movement
    }

    public update(paddles: Mesh[], table: { width: number, depth: number, isTriangular?: boolean, radius?: number }): void {
        // apply velocity to the X and Z positions
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.z += this.velocity.z;

        const ballRadius = 0.4;
        const tableZBound = table.depth / 2 - ballRadius;
        const tableXBound = table.width / 2 + ballRadius;

        // collision with sides of the table (only for rectangular table in 2-player mode)
        if (!table.isTriangular && (this.mesh.position.z > tableZBound || this.mesh.position.z < -tableZBound)) {
            this.velocity.z *= -1;
        }

        // Ball collision with paddles
        paddles.forEach((paddle: Mesh) => {
            const ballX = this.mesh.position.x;
            const ballZ = this.mesh.position.z;
            const paddleX = paddle.position!.x;
            const paddleZ = paddle.position!.z;

            const paddleHalfWidth = 0.25;
            const paddleHalfDepth = 1.5;

            const isWithinZBounds = Math.abs(ballZ - paddleZ) < (paddleHalfDepth + ballRadius);

            const distanceX = Math.abs(ballX - paddleX);
            const isCollidingX = distanceX < (paddleHalfWidth + ballRadius);

            if (isWithinZBounds && isCollidingX) {
                // Only reverse if ball is moving toward the paddle
                const movingTowardPaddle = (ballX < paddleX && this.velocity.x > 0) ||
                                          (ballX > paddleX && this.velocity.x < 0);

                if (movingTowardPaddle) {
                    this.velocity.x *= -1; // Direct reverse

                    // ppush ball out of paddle to prevent stuck state
                    if (ballX < paddleX) {
                        this.mesh.position.x = paddleX - paddleHalfWidth - ballRadius;
                    } else {
                        this.mesh.position.x = paddleX + paddleHalfWidth + ballRadius;
                    }

                    const hitOffset = (ballZ - paddleZ) / paddleHalfDepth;
                    this.velocity.z += hitOffset * this.speed * 0.3;
                }
            }
        });

        // Ball collision with X-axis walls (goals)
        if (this.mesh.position.x > tableXBound) {
            this.onLeftGoal();
        } else if (this.mesh.position.x < -tableXBound) {
            this.onRightGoal(); 
        }
    }
}
