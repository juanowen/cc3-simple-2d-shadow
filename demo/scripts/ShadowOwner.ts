import { _decorator, Component, Node, PolygonCollider2D, Vec2, v2 } from 'cc';
const { ccclass, property, requireComponent } = _decorator;
import { shadowDrawerEventTarget, ShadowDrawerEvent } from './ShadowDrawer';

@ccclass('ShadowOwner')
@requireComponent(PolygonCollider2D)
export class ShadowOwner extends Component {
    @property
    public shadowScale: number = 1;
    
    private _collider: PolygonCollider2D = null;

    onLoad() {
        this._collider = this.getComponent(PolygonCollider2D);
        if (this._collider) {
            this._collider.sensor = true;
            this._collider.apply();

            const worldPos: Vec2 = v2(this.node.worldPosition.x, this.node.worldPosition.y);
            const offset = this._collider.offset;
            const sOffset = v2(offset.x * this.node.scale.x, offset.y * this.node.scale.y);
            const points = this._collider.points.map((point: Vec2) => {
                const sPoint = v2(point.x * this.node.scale.x, point.y * this.node.scale.y);
                return worldPos.clone().add(sPoint).add(sOffset);
            });

            shadowDrawerEventTarget.emit(ShadowDrawerEvent.REGISTER_SHADOW_OBJECT, this, points);
        }
    }
}


