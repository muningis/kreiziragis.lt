interface IGlitchesOptions {
    text: string;
    fontFamily?: string;
    fontWeight?: number;
    phaseStep?: number;
    alphaMin?: number;
    amplitudeBase?: number;
    amplitudeRange?: number;
    glitchAmplitude?: number;
    glitchThreshold?: number;
}

class Glitcher {
    private text: string;
    private fontFamily: string = "Arial";
    private fontWeight: number = 500;
    private textSize: number = 0;
    private canvas: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private font: string = '';
    private textWidth: number = 0;
    private channel: number = 0;
    private compOp: "lighter" | "darker" | "xor" = 'lighter';
    private scanlineRange: number = 0;
    private scanlineBase: number = 0;
    private glitchThreshold: number = 0;
    private glitchAmplitude: number = 0;
    private alphaMin: number = 0;
    private amplitudeRange: number = 0;
    private amplitudeBase: number = 0;
    private amplitude: number = 0;
    private phaseStep: number = 0;
    private phase: number = 0;
    private scanlineShift: number = 0;

    constructor(querySelector: string, options: IGlitchesOptions) {
        let wrapper = document.querySelector(querySelector) as HTMLElement;
        wrapper.style.width = "100%";
        wrapper.style.padding = "0";
        wrapper.style.margin = "0 auto";
        wrapper.style.maxWidth = "100%";
        wrapper.style.textAlign = "center";
        this.canvas = document.createElement("canvas");
        this.canvas.style.boxSizing = "border-box";
        this.canvas.style.margin = "0 auto";
        this.canvas.style.maxWidth = "100%";
        wrapper.appendChild(this.canvas);
        if (this.canvas.getContext("2d")) {
            this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        }
        const { text } = options;
        this.text = text;

        if (typeof options.fontWeight !== "undefined") {
            this.fontWeight = options.fontWeight;
        }

        if (typeof options.fontFamily !== "undefined") {
            this.fontFamily = options.fontFamily;
        }

        this.initOptions(options);
        this.resize();
        this.tick();
    }

    initOptions(options: IGlitchesOptions) {
        this.width = document.documentElement.offsetWidth;
        this.height = document.documentElement.offsetHeight;

        this.textSize = Math.floor(this.width / 7);
        if (this.textSize > this.height) {
            this.textSize = Math.floor(this.height / 1.5);
        }

        this.font = `${this.fontWeight} ${this.textSize}px ${this.fontFamily}`;
        this.context.font = this.font;
        this.textWidth = this.context.measureText(this.text).width;

        this.channel = 0;
        this.compOp = "lighter";
        this.phase = 0.0;
        this.amplitude = 0.0;
        this.scanlineBase = 40;
        this.scanlineRange = 40;
        this.scanlineShift = 15;

        if (typeof options.phaseStep !== "undefined") {
            if (options.phaseStep > 1 || options.phaseStep < 0) {
                throw new Error("phaseStep must be in range [0,1]");
            }
            this.phaseStep = options.phaseStep;
        } else {
            this.phaseStep = 0.05;
        }

        if (typeof options.amplitudeBase !== "undefined") {
            if (options.amplitudeBase > 5 || options.amplitudeBase < 0) {
                throw new Error("amplitudeBase must be in range [0,5]");
            }
            this.amplitudeBase = options.amplitudeBase;
        } else {
            this.amplitudeBase = 2.0;
        }

        if (typeof options.amplitudeRange !== "undefined") {
            if (options.amplitudeRange > 5 || options.amplitudeRange < 0) {
                throw new Error("amplitudeRange must be in range [0,5]");
            }
            this.amplitudeRange = options.amplitudeRange;
        } else {
            this.amplitudeRange = 2.0;
        }

        if (typeof options.alphaMin !== "undefined") {
            if (options.alphaMin > 1 || options.alphaMin < 0) {
                throw new Error("alphaMin must be in range [0,1]");
            }
            this.alphaMin = options.alphaMin;
        } else {
            this.alphaMin = 0.8;
        }

        if (typeof options.glitchAmplitude !== "undefined") {
            if (options.glitchAmplitude > 100 || options.glitchAmplitude < 0) {
                throw new Error("glitchAmplitude must be in range [0,100]");
            }
            this.glitchAmplitude = options.glitchAmplitude;
        } else {
            this.glitchAmplitude = 20.0;
        }
        if (typeof options.glitchThreshold !== "undefined") {
            if (options.glitchThreshold > 1 || options.glitchThreshold < 0) {
                throw new Error("glitchThreshold must be in range [0,1]");
            }
            this.glitchThreshold = options.glitchThreshold;
        } else {
            this.glitchThreshold = 0.9;
        }
    }

    tick() {
        requestAnimationFrame(() => {
            this.phase += this.phaseStep;

            if (this.phase > 1) {
                this.phase = 0.0;
                this.channel = this.channel === 2 ? 0 : this.channel + 1;
                this.amplitude =
                    this.amplitudeBase + this.amplitudeRange * Math.random();
            }

            this.render();
            this.tick();
        })
    }

    render() {
        let x0: number = (this.amplitude * Math.sin(Math.PI * 2 * this.phase)) >> 0;
        let x1: number;
        let x2: number;
        let x3: number;

        if (Math.random() >= this.glitchThreshold) {
            x0 *= this.glitchAmplitude;
        }

        x1 = (this.width) >> 1;
        x2 = x1 + x0;
        x3 = x1 - x0;

        this.context.clearRect(0, 0, this.width, this.height);
        this.context.globalAlpha =
            this.alphaMin + (1 - this.alphaMin) * Math.random();

        switch (this.channel) {
            case 0:
                this.renderChannels(x1, x2, x3);
                break;
            case 1:
                this.renderChannels(x2, x3, x1);
                break;
            case 2:
                this.renderChannels(x3, x1, x2);
                break;
        }
        this.renderScanline();
        if (Math.floor(Math.random() * 2) > 1) {
            this.renderScanline();
        }
    }

    renderChannels(x1: number, x2: number, x3: number) {
        this.context.font = this.font;
        this.context.fillStyle = "rgb(255,0,0)";
        this.context.fillText(this.text, x1, this.height / 2);

        this.context.globalCompositeOperation = this.compOp;

        this.context.fillStyle = "rgb(0,255,0)";
        this.context.fillText(this.text, x2, this.height / 2);
        this.context.fillStyle = "rgb(0,0,255)";
        this.context.fillText(this.text, x3, this.height / 2);
    }

    renderScanline() {
        let y = (this.height * Math.random()) >> 0;
        let o = this.context.getImageData(0, y, this.width, 1);
        let d = o.data;
        let i = d.length;
        let s = (this.scanlineBase + this.scanlineRange * Math.random()) >> 0;
        let x = (-this.scanlineShift + this.scanlineShift * 2 * Math.random()) >> 0;

        while (i-- > 0) {
            d[i] += s;
        }

        this.context.putImageData(o, x, y);
    }

    resize() {
        this.width = document.documentElement.offsetWidth;
        this.height = document.documentElement.offsetHeight;
        if (this.canvas) {
            this.canvas.height = this.height;
            this.canvas.width = this.width;
            this.textSize = Math.floor(this.canvas.width / 14);
            if (this.textSize > this.height) {
                this.textSize = Math.floor(this.canvas.height / 1.5);
            }
            this.font = `${this.fontWeight} ${this.textSize}px ${this.fontFamily}`;
            this.context.textAlign = "center";
            this.context.font = this.font;
            this.textWidth = this.context.measureText(this.text).width;
        }
    }
}

window['Glitcher'] = Glitcher;
export default Glitcher;