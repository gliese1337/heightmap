export default class GameLoop {
  private _stop = false;
  private lastTime = 0;
  private frame: (seconds: number) => void

  constructor(private body: (seconds: number) => void) {
    this.frame = async(time: number) => {
      if (this._stop) return;
      const seconds = Math.min(1, (time - this.lastTime) / 1000);
      this.lastTime = time;
      await this.body(seconds);
      requestAnimationFrame(this.frame);
    }
  }
  
  stop() {
    this._stop = true;
  }

  start() {
    this._stop = false;
    requestAnimationFrame(time => {
      this.lastTime = time;
      this.frame(time);
    });
  }
}