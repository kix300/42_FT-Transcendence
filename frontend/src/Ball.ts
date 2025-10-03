import { Mesh, Scene, Vector3 } from '@babylonjs/core';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export class Ball {
    public mesh: Mesh;
    private velocity: Vector3 = Vector3.Zero();
    private speed: number = 0.2;
    private onLeftGoal: () => void;
    private onRightGoal: () => void;

    constructor(name: string, scene: Scene, onLeftGoal: () => void, onRightGoal: () => void) {
        this.mesh = MeshBuilder.CreateSphere(name, { diameter: 0.8 }, scene);
        this.mesh.position.y = 0.4; // Place ball slightly above the table
        this.onLeftGoal = onLeftGoal;
        this.onRightGoal = onRightGoal;

        const material = new StandardMaterial(name + 'Mat', scene);
        material.diffuseColor = Color3.Red(); // Red ball
        this.mesh.material = material;
    }

    public reset(): void {
        this.mesh.position.x = 0;
        this.mesh.position.z = 0;

        // *** FIX: Initialize velocity on the X-Z plane ***
        let angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4 + (Math.random() * Math.PI / 4)); // Limit starting angle
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.z = Math.sin(angle) * this.speed;
        this.velocity.y = 0; // Ensure no vertical movement
    }

    public update(paddles: Mesh[], table: { width: number, depth: number }): void {
        // *** FIX: Apply velocity to the X and Z positions ***
        this.mesh.position.x += this.velocity.x;
        this.mesh.position.z += this.velocity.z;

        const ballRadius = 0.4;
        const tableZBound = table.depth / 2 - ballRadius;
        const tableXBound = table.width / 2 + ballRadius;

        // *** FIX: Ball collision with Z-axis walls (sides of the table) ***
        if (this.mesh.position.z > tableZBound || this.mesh.position.z < -tableZBound) {
            this.velocity.z *= -1;
        }

        // Ball collision with paddles
        paddles.forEach(paddle => {
            if (this.mesh.intersectsMesh(paddle, false)) {
                this.velocity.x *= -1.05; // Reverse direction and slightly increase speed
                // Add a slight Z velocity based on where it hit the paddle
                let diff = this.mesh.position.z - paddle.position.z;
                this.velocity.z = diff * this.speed * 0.5;
            }
        });

        // Ball collision with X-axis walls (goals)
        if (this.mesh.position.x > tableXBound) {
            this.onLeftGoal(); // Player 1 (left) scored
        } else if (this.mesh.position.x < -tableXBound) {
            this.onRightGoal(); // Player 2 (right) scored
        }
    }
}
