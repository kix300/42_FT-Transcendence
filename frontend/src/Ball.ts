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
    private onBottomGoal?: () => void;
    private triangleVertices?: { v1: Vector3; v2: Vector3; v3: Vector3 };

    constructor(name: string, scene: Scene, onLeftGoal: () => void, onRightGoal: () => void, onBottomGoal?: () => void, triangleVertices?: { v1: Vector3; v2: Vector3; v3: Vector3 }) {
        this.mesh = MeshBuilder.CreateSphere(name, { diameter: 0.8 }, scene);
        this.mesh.position.y = 0.4; // slightly above the table
        this.onLeftGoal = onLeftGoal;
        this.onRightGoal = onRightGoal;
        this.onBottomGoal = onBottomGoal;
        this.triangleVertices = triangleVertices;

        const material = new StandardMaterial(name + 'Mat', scene);
        material.diffuseColor = Color3.Red(); // Red ball here
        this.mesh.material = material;
    }

    public dispose(): void {
        this.mesh.dispose();
    }

    /**
     * Check if ball is outside the triangle by checking which edge it crossed
     * Returns: 0 if inside, 1 if crossed edge v2-v1, 2 if crossed edge v3-v2, 3 if crossed edge v1-v3
     */
    private checkTriangleEdgeCrossing(): number {
        if (!this.triangleVertices) return 0;

        const { v1, v2, v3 } = this.triangleVertices;
        const ballPos = this.mesh.position;

        // Helper function to check which side of a line segment a point is on
        // Returns positive if point is on the left side, negative if on the right
        const crossProduct2D = (lineStart: Vector3, lineEnd: Vector3, point: Vector3): number => {
            return (lineEnd.x - lineStart.x) * (point.z - lineStart.z) -
                   (lineEnd.z - lineStart.z) * (point.x - lineStart.x);
        };

        // For a triangle with vertices in counter-clockwise order,
        // a point is inside if it's on the left side of all edges
        // Check each edge and determine if ball crossed it
        const edge1 = crossProduct2D(v1, v2, ballPos); // Edge v1 -> v2
        const edge2 = crossProduct2D(v2, v3, ballPos); // Edge v2 -> v3
        const edge3 = crossProduct2D(v3, v1, ballPos); // Edge v3 -> v1

        // If any cross product is negative, ball is outside that edge
        if (edge1 < 0) return 1; // Crossed edge v1-v2 (Player 3 scores)
        if (edge2 < 0) return 2; // Crossed edge v2-v3 (Player 1 scores)
        if (edge3 < 0) return 3; // Crossed edge v3-v1 (Player 2 scores)

        return 0; // Inside triangle
    }

    public reset(): void {
        this.mesh.position.x = 0;
        this.mesh.position.z = 0;

        if (this.onBottomGoal && this.triangleVertices) {
            // 3-player mode: random direction toward one of three vertices
            const { v1, v2, v3 } = this.triangleVertices;
            const vertices = [v1, v2, v3];
            const playerChoice = Math.floor(Math.random() * 3);
            const targetVertex = vertices[playerChoice];

            // Calculate angle toward the chosen vertex
            const baseAngle = Math.atan2(targetVertex.z, targetVertex.x);

            // Random angle offset from the main direction (between -30 and 30 degrees)
            const angleOffset = (Math.random() - 0.5) * Math.PI / 3;
            const totalAngle = baseAngle + angleOffset;

            this.velocity.x = Math.cos(totalAngle) * this.speed;
            this.velocity.z = Math.sin(totalAngle) * this.speed;
        } else {
            // 2-player mode: random direction toward left (-1) or right (1) player
            const direction = Math.random() > 0.5 ? 1 : -1;
            // between 10-45 degrees
            const angle = (Math.random() * Math.PI / 6) + (Math.PI / 18);

            this.velocity.x = direction * Math.cos(angle) * this.speed;
            this.velocity.z = Math.sin(angle) * this.speed * (Math.random() > 0.5 ? 1 : -1);
        }

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

        // Ball collision with goals
        if (table.isTriangular && this.onBottomGoal) {
            // 3-player mode: check which triangle edge the ball crossed
            const edgeCrossed = this.checkTriangleEdgeCrossing();

            if (edgeCrossed === 1) {
                // Crossed edge v1-v2 (opposite to paddle 3)
                this.onBottomGoal(); // Player 3 scores
            } else if (edgeCrossed === 2) {
                // Crossed edge v2-v3 (opposite to paddle 1)
                this.onLeftGoal(); // Player 1 scores
            } else if (edgeCrossed === 3) {
                // Crossed edge v3-v1 (opposite to paddle 2)
                this.onRightGoal(); // Player 2 scores
            }
        } else {
            // 2-player mode: goals on X-axis walls only
            if (this.mesh.position.x > tableXBound) {
                this.onLeftGoal();
            } else if (this.mesh.position.x < -tableXBound) {
                this.onRightGoal();
            }
        }
    }
}
