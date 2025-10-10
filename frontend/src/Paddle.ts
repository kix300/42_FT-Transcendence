import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class Paddle {
    public mesh: Mesh;
    public velocity: Vector3 = Vector3.Zero();
    private speed: number = 0.2;
    private zBounds: number;
    private movementDirection?: Vector3; 
    private edgeStart?: Vector3; 
    private edgeEnd?: Vector3; 

    constructor(name: string, position: Vector3, tableDepth: number, scene: Scene, edgeStart?: Vector3, edgeEnd?: Vector3) {
        this.mesh = MeshBuilder.CreateBox(name, { width: 0.5, height: 1, depth: 3 }, scene);
        this.mesh.position = position.clone();

        this.zBounds = (tableDepth / 2) - (3 / 2);

        if (edgeStart && edgeEnd) {
            this.edgeStart = edgeStart.clone();
            this.edgeEnd = edgeEnd.clone();
            this.movementDirection = edgeEnd.subtract(edgeStart).normalize();
        }

        const material = new StandardMaterial(name + 'Mat', scene);
        material.diffuseColor = Color3.Gray(); // Set paddle color to gray
        this.mesh.material = material;
    }

    public movePositiveZ(): void {
        if (this.movementDirection) {
            this.velocity = this.movementDirection.scale(this.speed);
        } else {
            this.velocity.z = this.speed;
        }
    }

    public moveNegativeZ(): void {
        if (this.movementDirection) {
            this.velocity = this.movementDirection.scale(-this.speed);
        } else {
            this.velocity.z = -this.speed;
        }
    }

    public stop(): void {
        this.velocity = Vector3.Zero();
    }

    public update(): void {
        if (this.movementDirection && this.edgeStart && this.edgeEnd) {
            const edgeVector = this.edgeEnd.subtract(this.edgeStart);
            const edgeLength = edgeVector.length();

            const currentVector = this.mesh.position.subtract(this.edgeStart);
            const currentProjection = Vector3.Dot(currentVector, this.movementDirection);

            const velocityProjection = Vector3.Dot(this.velocity, this.movementDirection);
            let newProjection = currentProjection + velocityProjection;

            const paddleHalfLength = 1.5; 
            const minProjection = paddleHalfLength;
            const maxProjection = edgeLength - paddleHalfLength;
            newProjection = Math.max(minProjection, Math.min(maxProjection, newProjection));

            this.mesh.position = this.edgeStart.add(this.movementDirection.scale(newProjection));
            this.mesh.position.y = 0.5;
        } else {
            this.mesh.position.z += this.velocity.z;

            if (this.mesh.position.z > this.zBounds) {
                this.mesh.position.z = this.zBounds;
            } else if (this.mesh.position.z < -this.zBounds) {
                this.mesh.position.z = -this.zBounds;
            }
        }
    }
}
