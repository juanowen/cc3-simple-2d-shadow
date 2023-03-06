import { _decorator, Node, Camera, UITransform, Rect, EventTarget, view, size } from 'cc';
const { ccclass, property } = _decorator;


export const shadowCameraEventTarget: EventTarget = new EventTarget();
export const ShadowCameraEvent = {
    STICK_NODE_TO_CAMERA: 'stickNodeToCamera'
}

@ccclass('ShadowCamera')
export class ShadowCamera extends Camera {
	private _transform: UITransform = null;

    onLoad() {
		super.onLoad();
		if (this.enabled) {
			if (this.targetTexture) {
                view.on('canvas-resize', this.onCanvasResize, this);
                shadowCameraEventTarget.on(ShadowCameraEvent.STICK_NODE_TO_CAMERA, this.onStickNodeToCamera, this);
			} else {
				this.enabled = false;
			}
		}
    }

	start() {
		this.onCanvasResize();
	}

	getVisibleRect() {
		const viewSize = view.getVisibleSize();
		const sideRatio = viewSize.width / viewSize.height;
		const center = this.node.worldPosition;

		const cameraHeight = this.orthoHeight * 2;
		const cameraWidth = sideRatio * cameraHeight;

		const visibleRect = new Rect(
            center.x - 0.5 * cameraWidth, 
            center.y - 0.5 * cameraHeight,
			cameraWidth, 
            cameraHeight
        );
		
		return visibleRect;
	}

	onCanvasResize() {
        const cameraSize = this.getVisibleRect();
        this.targetTexture.resize(cameraSize.width, cameraSize.height);

        if (this._transform) {
            const renderTextureSize = size(cameraSize.width, cameraSize.height);
            this._transform.setContentSize(renderTextureSize);
        }
	}

	onStickNodeToCamera(node: Node, callback: Function) {
        this._transform = node.getComponent(UITransform);
        this._transform.setContentSize(this.camera.width, this.camera.height);

        this.orthoHeight = this._transform.height / 2;

        const curPos = this.node.getWorldPosition();
        const newPos = node.getWorldPosition();
        this.node.setWorldPosition(newPos.x, newPos.y, curPos.z);
        
        this.targetTexture.resize(this._transform.width, this._transform.height);

        callback instanceof Function && callback(this.targetTexture);
	}
}

