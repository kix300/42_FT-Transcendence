import { Mesh, Scene, Vector3 } from '@babylonjs/core';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export class Paddle {
    public mesh: Mesh;
    public velocity: Vector3 = Vector3.Zero();
    private speed: number = 0.2;
    private zBounds: number;

    constructor(name: string, position: Vector3, tableDepth: number, scene: Scene) {
        this.mesh = MeshBuilder.CreateBox(name, { width: 0.5, height: 1, depth: 3 }, scene);
        this.mesh.position = position;

        // Set the zBounds based on the table's depth and paddle's depth
        this.zBounds = (tableDepth / 2) - (3 / 2);

        const material = new StandardMaterial(name + 'Mat', scene);
        material.diffuseColor = Color3.Gray(); // Set paddle color to gray
        this.mesh.material = material;
    }

    // *** FIX: Move paddle along the Z-axis (horizontally) ***
    public movePositiveZ(): void {
        this.velocity.z = this.speed;
    }

    public moveNegativeZ(): void {
        this.velocity.z = -this.speed;
    }

    public stop(): void {
        this.velocity.z = 0;
    }

    public update(): void {
        // *** FIX: Apply velocity to the Z position ***
        this.mesh.position.z += this.velocity.z;

        // Keep the paddle within the horizontal (Z-axis) bounds
        if (this.mesh.position.z > this.zBounds) {
            this.mesh.position.z = this.zBounds;
        } else if (this.mesh.position.z < -this.zBounds) {
            this.mesh.position.z = -this.zBounds;
        }
    }
}
