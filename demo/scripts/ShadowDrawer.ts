import { _decorator, Component, Node, EventTarget, Vec2, Graphics, Material, v2, Color, Intersection2D, EffectAsset, graphicsAssembler, Layers, Sprite, RenderTexture, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;
import { ShadowOwner } from './ShadowOwner';
import { shadowCameraEventTarget, ShadowCameraEvent } from './ShadowCamera';


export const shadowDrawerEventTarget: EventTarget = new EventTarget();
export const ShadowDrawerEvent = {
    REGISTER_SHADOW_OBJECT: 'registerShadowObject',
    REDRAW_SHADOW: 'redrawShadow',
    CLEAR_SHADOW_OBJECTS: 'clearShadowObjects'
}

@ccclass('ShadowRender')
class ShadowRender {
    @property
    public owner: ShadowOwner = null;
    @property
    public points: Vec2[] = [];
    @property
    public scale: number = 1;

    constructor(owner: ShadowOwner, points: Vec2[]) {
        this.owner = owner;
        this.points = points;
        this.scale = owner.shadowScale;
    }
}

@ccclass('ShadowDrawer')
export class ShadowDrawer extends Component {
    @property
    public shadowColor: Color = new Color(0, 0, 0);
    @property
    public shadowAngle: number = 0;
    @property
    public shadowLength: number = 10;
    @property
    public shadowBlurWidth: number = 10;
    @property({ type: EffectAsset })
    public fillEffect: EffectAsset = null;
    @property({ type: EffectAsset })
    public strokeEffect: EffectAsset = null;
    @property({ type: EffectAsset })
    public renderEffect: EffectAsset = null;

    private _shadowRenders: Array<ShadowRender> = [];
    private _fillGraphics: Graphics = null;
    private _strokeGraphics: Graphics = null;

    onLoad() {
        this._fillGraphics = this._createGraphics('FillNode', this.fillEffect);
        this._strokeGraphics = this._createGraphics('StrokeNode', this.strokeEffect);

        this._strokeGraphics.lineWidth = this.shadowBlurWidth;
        this._strokeGraphics.lineJoin = Graphics.LineJoin.ROUND;

        shadowDrawerEventTarget.on(ShadowDrawerEvent.REGISTER_SHADOW_OBJECT, this.onRegisterShadowObject, this);
        shadowDrawerEventTarget.on(ShadowDrawerEvent.REDRAW_SHADOW, this.onRedrawShadow, this);
        shadowDrawerEventTarget.on(ShadowDrawerEvent.CLEAR_SHADOW_OBJECTS, this.onClearShadowObjects, this);
    }

    start() {
        this._createRenderNode();
        this._drawShadow();
    }

    _createGraphics(nodeName: string, effectAsset: EffectAsset) {
        const fillNode = new Node(nodeName);
        const graphics = fillNode.addComponent(Graphics);

        graphics.strokeColor = this.shadowColor;
        graphics.fillColor = this.shadowColor;

        fillNode.layer = Layers.Enum['shadow'];
        fillNode.setParent(this.node);
        
        this._setShadowMaterial(graphics, effectAsset);

        return graphics;
    }

    _createRenderNode() {
        const renderNode = new Node('RenderNode');
        renderNode.layer = Layers.Enum.UI_2D;
        renderNode.setParent(this.node);
        
        const sprite = renderNode.addComponent(Sprite);

        shadowCameraEventTarget.emit(ShadowCameraEvent.STICK_NODE_TO_CAMERA, renderNode, (texture: RenderTexture) => {
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            sprite.spriteFrame = spriteFrame;

            this._setShadowMaterial(sprite, this.renderEffect);
        });
    }

    _drawShadow() {
        const shadowRads = this.shadowAngle * (Math.PI / 180);

        this._fillGraphics.clear();
        this._strokeGraphics.clear();

        this._shadowRenders.forEach((render: ShadowRender) => {
            const shift = v2(
                Math.cos(shadowRads) * this.shadowLength * render.scale,
                Math.sin(shadowRads) * this.shadowLength / 2 * render.scale
            );

            const strokePoints: Array<any> = [];
            const fillRects = render.points.map((point, i, array) => {
                strokePoints.push({ position: point.clone(), isBase: true, isExternal: true });
                strokePoints.push({ position: point.clone().add(shift), isBase: false, isExternal: true, link: strokePoints[i * 2] });
                strokePoints[i * 2].link = strokePoints[i * 2 + 1];

                const nextPoint = array[(i + 1) % array.length];
                return [
                    point.clone(),
                    nextPoint.clone(),
                    nextPoint.clone().add(shift),
                    point.clone().add(shift)
                ]
            });

            const basePoints = strokePoints.filter(p => p.isBase);
            const extraPoints = strokePoints.filter(p => !p.isBase);

            fillRects.push(basePoints.map(point => point.position));
            fillRects.push(extraPoints.map(point => point.position));

            fillRects.forEach(rect => {
                const targetStrokePoints = strokePoints.filter(point => rect.find(p => p.equals(point.position)) === undefined);
                targetStrokePoints.forEach(point => {
                    if (Intersection2D.pointInPolygon(point.position, rect)) {
                        point.isExternal = false;
                    }
                });

                rect.forEach((point, i) => {
                    const func = i === 0 ? 'moveTo' : 'lineTo';
                    this._fillGraphics[func](point.x, point.y);
                });
                this._fillGraphics.fill();
            });

            // basePoints.forEach(point => {
            //     if (Intersection2D.pointInPolygon(point.position, extraPoints.map(p => p.position))) {
            //         point.isExternal = false;
            //     } 
            // });
            // extraPoints.forEach(point => {
            //     if (Intersection2D.pointInPolygon(point.position, basePoints.map(p => p.position))) {
            //         point.isExternal = false;
            //     } 
            // });

            const limit = strokePoints.filter(p => p.isExternal).length;
            let currentPoint = basePoints.find(p => p.isExternal);

            this._strokeGraphics.moveTo(currentPoint.position.x, currentPoint.position.y);

            const startPosition = currentPoint.position;
            let ticker = 1;

            while(ticker < limit) {
                const isBase = currentPoint.isBase;
                const index = isBase ? basePoints.indexOf(currentPoint) : extraPoints.indexOf(currentPoint);
                const length = isBase ? basePoints.length : extraPoints.length;
                const nextPoint = isBase ? basePoints[(index + 1) % length] : extraPoints[(index + 1) % length];

                if (nextPoint.isExternal) {
                    currentPoint = nextPoint;
                } else {
                    currentPoint = currentPoint.link;
                }

                this._strokeGraphics.lineTo(currentPoint.position.x, currentPoint.position.y);

                ticker++;
            }
            
            this._strokeGraphics.lineTo(startPosition.x, startPosition.y);
            this._strokeGraphics.stroke();
        });
    }

    _setShadowMaterial(renderer: Sprite | Graphics, effectAsset: EffectAsset) {
        if (renderer && effectAsset) {
            const material = new Material();
			material.initialize({
				effectAsset,
				defines: { USE_RGBE_CUBEMAP: true }
			});

            renderer.setMaterial(material, 0);
            if (renderer.sharedMaterial.getProperty('shadowColor') !== undefined) {
                renderer.sharedMaterial.setProperty('shadowColor', this.shadowColor);
            }
            renderer.updateRenderer();
        }
    }

    onRegisterShadowObject(owner: ShadowOwner, points: Array<Vec2>) {
        const localPoints = points.map((point: Vec2) => {
            return point.subtract(v2(this.node.worldPosition.x, this.node.worldPosition.y))
        });
        this._shadowRenders.push(new ShadowRender(owner, localPoints));
    }

    onRedrawShadow(angle?: number, length?: number) {
        if (angle !== undefined) {
            this.shadowAngle = angle;
        }
        if (length !== undefined) {
            this.shadowLength = length;
        }

        this._drawShadow();
    }

    onClearShadowObjects() {
        this._shadowRenders = [];
        this._drawShadow();
    }
}


