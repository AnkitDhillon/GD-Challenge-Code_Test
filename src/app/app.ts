import { GetSprite } from "../assets/loader";
import * as PIXI from "pixi.js";

export class Game {
	public app: PIXI.Application;
	static stage: PIXI.Container;
	static container: PIXI.Container = new PIXI.Container(); // Camera to follow tank around
	static mapSize: number = 50; // Square shaped map grid - extendable
	static blockSize: number = 35+1; // 35 block size + 1 to get black grid lines
	static hayCount: number = 25; // num of hays to spawn
	static wallCount: number = 50; // num of walls to spawn
	static propsArray: any[] = [];
	static tank: any;
	static changeTank: number = 0;
	static sideways: number = 0;
	static forward: number = 0;
	static shoot: number = 0;
	static bulletsArray: any[] = [];
	static OutsideBoundsMax: number = 1800; // stop tanks and bullets when off the map grid
	static OutsideBoundsMin: number = 10;

	constructor(parent: HTMLElement, width: number, height: number) {
		this.app = new PIXI.Application({
			width,
			height,
			backgroundColor: 0X111111,
		});
		// Hack for parcel HMR
		parent.replaceChild(this.app.view, parent.lastElementChild);
		Game.stage = this.app.stage;
		Game.stage.addChild(Game.container);
		Game.container.position.x = this.app.renderer.width/2;
		Game.container.position.y = this.app.renderer.height/2;
		Game.setUpGame();
		this.app.ticker.add(delta => {
			Game.update(delta);
		});
	}

	static setUpGame() {
		// Spawn a 50 x 50 grid of map
		for (let columns:number = 0; columns < Game.mapSize; columns ++){ // Vetical grid
			for(let rows:number = 0; rows < Game.mapSize; rows ++){ // Horizontal grid
				let block = GetSprite("ground");
				block.x = rows*Game.blockSize;
				block.y = columns*Game.blockSize;
				//Game.stage.addChild(block);
				Game.container.addChild(block);
			}
		}
		// Collect random map grids to spawn hay and wall at - into an array
		var arr:number[] = [];
		while(arr.length < Game.hayCount + Game.wallCount + 1){
			let r:number = Math.floor(Math.random() * 2500) + 1;
			if(arr.indexOf(r) === -1) arr.push(r);
		}
		// Spawn Hay
		for (let i: number = 0; i < Game.hayCount; i ++){
			let prop = new Prop( 'hay', arr[i], true );
			Game.propsArray.push(prop);
			Game.container.addChild(prop.sprite);
		}
		arr.splice(0,25);
		// Spawn Wall
		for (let i: number = 0; i < Game.wallCount; i ++){
			let prop = new Prop( 'wall', arr[i], false );
			Game.propsArray.push(prop);
			Game.container.addChild(prop.sprite);
		}
		// Spawn tank randomly like Hay and wall and not overlapping any other prop
		Game.tank = new Tank(arr[50]);
	}

	static update(delta: number) {
		// Update tank
		Game.tank.update(delta);
		// Camera follows tank
		Game.container.pivot.x = Game.tank.sprite.x;
		Game.container.pivot.y = Game.tank.sprite.y;
		
		// Update bullets
		for (let i in Game.bulletsArray){
			Game.bulletsArray[i].sprite.y -= (Game.bulletsArray[i].bulletSpeed*Game.bulletsArray[i].vSpeed)*delta;
			Game.bulletsArray[i].sprite.x += (Game.bulletsArray[i].bulletSpeed*Game.bulletsArray[i].hSpeed)*delta;
			for (let a in Game.propsArray) {
				if (Game.bulletsArray[i].collidesWith(Game.propsArray[a].sprite)) {
					Game.container.removeChild(Game.bulletsArray[i].sprite);
					let d = Game.bulletsArray[i].damage;
					Game.bulletsArray.splice(parseInt(i),1);
					if (Game.propsArray[a].breakable){
						Game.propsArray[a].health -= d;
						if (Game.propsArray[a].health <= 0) {
							Game.container.removeChild(Game.propsArray[a].sprite);
							Game.propsArray.splice(parseInt(a),1);
						}
					}
					return;
				}
			}
			// delete bullets if off of map grid
			if (Game.bulletsArray[i].sprite.y > Game.OutsideBoundsMax || Game.bulletsArray[i].sprite.y < Game.OutsideBoundsMin){
				Game.container.removeChild(Game.bulletsArray[i].sprite);
				Game.bulletsArray.splice(parseInt(i),1);
				return;
			}

			else if (Game.bulletsArray[i].sprite.x > Game.OutsideBoundsMax || Game.bulletsArray[i].sprite.x < Game.OutsideBoundsMin){
				Game.container.removeChild(Game.bulletsArray[i].sprite);
				Game.bulletsArray.splice(parseInt(i),1);
				return;
			}
		}
	}
}

class Tank {
	sprite: PIXI.Sprite;
	tankSpeed: number = 4;
	tankType: number = 0; // 0 == red | 1 == blue | 2 == green :)

	public constructor( spawnAtGridNo: number ) {
		this.sprite = GetSprite('tank');
		let column: number = Math.ceil(spawnAtGridNo/50);
		while (spawnAtGridNo > 50){
			spawnAtGridNo -= 50;
		}
		let row:number = spawnAtGridNo;
		this.sprite.y = (column * Game.blockSize)-Game.blockSize/2;
		this.sprite.x = (row * Game.blockSize)-Game.blockSize/2;
		Game.container.addChild(this.sprite);
		this.sprite.anchor.set(0.5, 0.5);

		document.onkeydown = function(e: KeyboardEvent):any {
			switch (e.key) {
				case ' ':
					if (!e.repeat)
						Game.shoot = 1;//spacebar - shoot
					break;
				case 't':
					if (!e.repeat)
						Game.changeTank = 1;//T - change tank
					break;
				case 'ArrowLeft':
					Game.forward = 0;
					Game.sideways = -1;
					break;
				case 'ArrowUp':
					Game.sideways = 0;
					Game.forward = 1;
					break;
				case 'ArrowRight':
					Game.forward = 0;
					Game.sideways = 1;
					break;
				case 'ArrowDown':
					Game.sideways = 0;
					Game.forward = -1;
					break;
			}
		}
		
		document.onkeyup = function(e: KeyboardEvent):any {
			switch (e.key) {
				case 'ArrowLeft':
					if (Game.sideways == -1)
						Game.sideways = 0;
					break;
				case 'ArrowUp':
					Game.forward = 0;
					break;
				case 'ArrowRight':
					if (Game.sideways == 1)
						Game.sideways = 0;
					break;
				case 'ArrowDown':
					Game.forward = 0;
					break;
			}
		}
		
	}

	public shootBullet(bulletDirection: number, xPos:number, yPos:number) {
		let bullet_Hspeed: number = 0;
		let bullet_Vspeed: number = 0;
		if (bulletDirection == 180)
			bullet_Vspeed = 1;
		else if (bulletDirection == 0)
			bullet_Vspeed = -1;
		else if (bulletDirection == 90)
			bullet_Hspeed = -1;
		else if (bulletDirection == 270)
			bullet_Hspeed = 1;

		let bulletsToSpawn: number = 2;
		let d: number = 10;
		if (this.tankType == 1){
			d = 20;
			bulletsToSpawn = 3;
		}
		else if (this.tankType == 2){
			d = 25;
			bulletsToSpawn = 1;
		}
		const wait = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))
		const loop = async () => {
			for (let i:number = 0; i < bulletsToSpawn; i ++){
				let b = new Bullet(bullet_Hspeed, bullet_Vspeed, xPos, yPos, d);
				b.sprite.angle = bulletDirection;
				Game.container.addChild(b.sprite);
				Game.bulletsArray.push(b);
				await wait(100)
			}
		}
		loop();
	}

	private collidesWith(otherSprite: PIXI.Sprite) {
		let ab = this.sprite.getBounds();
		let bb = otherSprite.getBounds();
		return !(
			ab.x > bb.x + bb.width ||
			ab.x + ab.width < bb.x ||
			ab.y + ab.height < bb.y ||
			ab.y > bb.y + bb.height
		);
	}

	public update(delta: number) {
		// Tank's response to input
		let oldY:number = this.sprite.y;
		let oldX:number = this.sprite.x;
		this.sprite.y -= (this.tankSpeed*Game.forward)*delta;
		this.sprite.x += (this.tankSpeed*Game.sideways)*delta;
		// stop tank from going over the map grid
		if (this.sprite.y > Game.OutsideBoundsMax || this.sprite.y < Game.OutsideBoundsMin) {
			this.sprite.y = oldY;
		}
		else if (this.sprite.x > Game.OutsideBoundsMax || this.sprite.x < Game.OutsideBoundsMin) {
			this.sprite.x = oldX;
		}
		// look in the direction moving
		if (Game.forward == 1)
			this.sprite.angle = 180;
		else if (Game.forward == -1)
			this.sprite.angle = 0;
		else if (Game.sideways == -1)
			this.sprite.angle = 90;
		else if (Game.sideways == 1)
			this.sprite.angle = 270;
		if (Game.shoot){
			this.shootBullet(this.sprite.angle, this.sprite.x, this.sprite.y);
			Game.shoot = 0;
		}
		if (Game.changeTank){
			this.tankType ++;
			if (this.tankType > 2)
				this.tankType = 0
			Game.tank.sprite.gotoAndStop(this.tankType);
			
			Game.changeTank = 0;
		}
		// Collision check
		for (const currentEntity of Game.propsArray) {
			if (this.collidesWith(currentEntity.sprite)) {
				this.sprite.x = oldX;
				this.sprite.y = oldY;
			}
		}
		
	}
}

class Bullet {
	sprite: PIXI.Sprite;
	hSpeed: number;
	vSpeed: number;
	bulletSpeed: number = 10;
	damage: number;
	
	public constructor( hSpeed: number, vSpeed:number, spawnX: number, spawnY: number, damage: number) {
		this.sprite = GetSprite('bullet');
		this.sprite.anchor.set(0.5, 0);
		this.sprite.x = spawnX;
		this.sprite.y = spawnY;
		this.hSpeed = hSpeed;
		this.vSpeed = vSpeed;
		this.damage = damage;
	}

	public collidesWith(otherSprite: PIXI.Sprite) {
		let ab = this.sprite.getBounds();
		let bb = otherSprite.getBounds();
		return !(
			ab.x > bb.x + bb.width ||
			ab.x + ab.width < bb.x ||
			ab.y + ab.height < bb.y ||
			ab.y > bb.y + bb.height
		);
	}
}

// Class for Hay and Wall
class Prop {
	sprite: PIXI.Sprite;
	breakable: boolean;
	column: number;
	row: number;
	health: number = 100;
	public constructor( spriteName: string, gridNum: number, breakable: boolean) {
		this.sprite = GetSprite(spriteName);
		this.column = Math.ceil(gridNum/50)-1;
		while (gridNum > 50){
			gridNum -= 50;
		}
		this.row = gridNum-1;
		this.sprite.y = this.column * Game.blockSize;
		this.sprite.x = this.row * Game.blockSize;
		this.breakable = breakable;
	}
}


