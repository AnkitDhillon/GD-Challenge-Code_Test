import tank from './images/tank/*.png';
import ground from './images/ground/*.png';
import hay from './images/hay/*.png';
import wall from './images/wall/*.png';
import bullet from './images/bullet/*.png';
import * as PIXI from 'pixi.js';

const spriteNames = {
    tank: Object.values(tank),
    ground: Object.values(ground),
    hay: Object.values(hay),
    wall: Object.values(wall),
    bullet: Object.values(bullet),
};

export function GetSprite(name) {
    return new PIXI.AnimatedSprite(spriteNames[name].map(path => PIXI.Texture.from(path)))
}
