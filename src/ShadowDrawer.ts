import { _decorator, Component, Node, EventTarget, Vec2, Graphics, Material, v2, Color, Intersection2D, EffectAsset, graphicsAssembler, Layers, Sprite, RenderTexture, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;
import { ShadowOwner } from './ShadowOwner';
import { ShadowCamera } from './ShadowCamera';


const shadowDrawerEventTarget: EventTarget = new EventTarget();
enum ShadowDrawerEvent {
    REGISTER_SHADOW_OBJECT,
    REDRAW_SHADOW,
    CLEAR_SHADOW_OBJECTS
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
    static eventTarget: EventTarget = shadowDrawerEventTarget;
    static EventType: typeof ShadowDrawerEvent = ShadowDrawerEvent;

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

        ShadowCamera.eventTarget.emit(ShadowCamera.EventType.STICK_NODE_TO_CAMERA, renderNode, (texture: RenderTexture) => {
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            sprite.spriteFrame = spriteFrame;

            this._setShadowMaterial(sprite, this.renderEffect);
        });
    }

    // TODO: this method needs refactoring
    _drawShadow() {
        const shadowRads = this.shadowAngle * (Math.PI / 180);

        this._fillGraphics.clear();
        this._strokeGraphics.clear();

        this._shadowRenders.forEach((render: ShadowRender) => {
            const shadowRenderPoints: Vec2[] = [];
            let pointsCenter = v2(0, 0);
            let shiftedPointsCenter = v2(0, 0);

            // calculate shadow shift vector
            const shift = v2(
                Math.cos(shadowRads) * this.shadowLength * render.scale,
                Math.sin(shadowRads) * this.shadowLength / 2 * render.scale
            );

            // calculate shadow offset points
            const shiftedPoints: Vec2[] = render.points.map((point: Vec2) => point.clone().add(shift));

            // remove points that fall into the shadow zone
            // and calculate the points to draw the shadow
            render.points.forEach((point: Vec2, i: number) => {
                this._checkPointInShadow(render.points, i, shiftedPoints, shadowRenderPoints);
                pointsCenter = pointsCenter.add(point);
            });
            shiftedPoints.forEach((point: Vec2, i: number) => {
                this._checkPointInShadow(shiftedPoints, i, render.points, shadowRenderPoints);
                shiftedPointsCenter = shiftedPointsCenter.add(point);
            });

            // calculate the center of the shadow base and the center of the shadow offset points
            pointsCenter = pointsCenter.multiplyScalar(1 / render.points.length);
            shiftedPointsCenter = shiftedPointsCenter.multiplyScalar(1 / shiftedPoints.length);

            // calculate the center of all shadow rendering points
            const shadowCenter = pointsCenter.lerp(shiftedPointsCenter, 0.5);

            // sort the shadow rendering points counterclockwise
            shadowRenderPoints.sort((pointA, pointB) => {
                const dirA: Vec2 = Vec2.subtract(v2(), pointA, shadowCenter);
                const dirB: Vec2 = Vec2.subtract(v2(), pointB, shadowCenter);

                const angleA: number = Math.atan2(dirA.y, dirA.x);
                const angleB: number = Math.atan2(dirB.y, dirB.x);

                return angleA - angleB;
            });

            // draw shadow graphics
            this._fillGraphics.moveTo(shadowRenderPoints[0].x, shadowRenderPoints[0].y);
            this._strokeGraphics.moveTo(shadowRenderPoints[0].x, shadowRenderPoints[0].y);

            for (let i = 1; i < shadowRenderPoints.length; i++) {
                this._fillGraphics.lineTo(shadowRenderPoints[i].x, shadowRenderPoints[i].y);
                this._strokeGraphics.lineTo(shadowRenderPoints[i].x, shadowRenderPoints[i].y);
            }

            this._fillGraphics.fill();

            this._strokeGraphics.lineTo(shadowRenderPoints[0].x, shadowRenderPoints[0].y);
            this._strokeGraphics.stroke();
        });
    }

    _checkPointInShadow(points: Vec2[], pointIndex: number, linkedPoints: Vec2[], resultArray: Vec2[]) {
        const point: Vec2 = points[pointIndex];
        const linkedPoint: Vec2 = linkedPoints[pointIndex];
        const testPolygon: Vec2[] = points.reduce((res: Vec2[], p: Vec2) => {
                res.push(p.equals(point) ? linkedPoint : p);
                return res;
            },
            []
        );
        if (!Intersection2D.pointInPolygon(point, testPolygon)) {
            resultArray.push(point);
        }
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


