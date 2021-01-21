/**
 *
 * Run `yarn global add canvas` first
 */

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const outputFolder = path.join(__dirname, "..", "fluids", "sets");

const variants = {
    first: "#61ef6f",
    second: "#5fb2f1",
    conflict: "#f74c4c",
};

async function run() {
    console.log("Running");

    const fps = 14;
    const dimensions = 192;
    const pipeBorder = 23.5;
    const lineSize = 5;

    const SColor = '#323232';
    const pipeColor = "#d2d4d9";
    const SBlur = 6;
    const insidecolor = "#6a7e98";
    const borderwidth = 4;
    const promises = [];
    // Generate direction TODO

    // First, generate the forward pipe
    for (let i = 0; i < fps; ++i) {
        /** @type {HTMLCanvasElement} */
        const canvas = createCanvas(dimensions, dimensions);
        const context = canvas.getContext("2d");
        context.quality = "best";
        context.clearRect(0, 0, dimensions, dimensions);
        // outside border
        context.beginPath()
        context.fillStyle = pipeColor;
        context.rect(pipeBorder-2, dimensions-2, pipeBorder+4,dimensions+4);
        context.fill();
        // inside border & inside fill & shadow
        context.save();
        context.beginPath()
        context.fillStyle = insidecolor;
        context.strokeStyle = insidecolor;
        context.lineWidth = borderwidth;
        context.rect(pipeBorder, -10, dimensions - 2 * pipeBorder, dimensions + 20);
        context.fill();
        context.clip();
        context.shadowColor = SColor;
        context.shadowBlur = SBlur;
        context.stroke();
        context.restore();


        const out = fs.createWriteStream(path.join(outputFolder, "forward_" + i + ".png"));
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        promises.push(new Promise(resolve => stream.on("end", resolve)));
    }

    // Generate left and right side pipe
    for (let i = 0; i < fps; ++i) {
        /** @type {HTMLCanvasElement} */
        const canvas = createCanvas(dimensions, dimensions);
        const context = canvas.getContext("2d");
        context.quality = "best";

        const procentual = i / fps;
        context.clearRect(0, 0, dimensions, dimensions);

        context.beginPath()
        context.fillStyle = pipeColor;
        context.moveTo(pipeBorder, dimensions + 10);
        context.lineTo(pipeBorder, dimensions - pipeBorder);
        context.fill();
        // inside border & inside fill & shadow
        context.save();
        context.beginPath()
        context.fillStyle = insidecolor;
        context.strokeStyle = insidecolor;
        context.lineWidth = borderwidth;
        context.shadowColor = SColor;
        context.shadowBlur = SBlur;
        context.beginPath();
        context.moveTo(pipeBorder, dimensions + 10);
        context.lineTo(pipeBorder, dimensions - pipeBorder);

        const steps = 256;

        const outerRadius = dimensions - 2 * pipeBorder;

        const originX = dimensions - pipeBorder;
        const originY = dimensions - pipeBorder;

        const sqrt = x => Math.pow(Math.abs(x), 0.975) * Math.sign(x);

        for (let k = 0; k <= steps; ++k) {
            const pct = k / steps;
            const angleRad = Math.PI + pct * Math.PI * 0.5;
            const offX = originX + sqrt(Math.cos(angleRad)) * outerRadius;
            const offY = originY + sqrt(Math.sin(angleRad)) * outerRadius;

            context.lineTo(offX, offY);
        }

        context.lineTo(dimensions + 10, pipeBorder);
        context.lineTo(dimensions + 10, dimensions - pipeBorder);
        context.lineTo(dimensions, dimensions - pipeBorder);

        for (let k = 0; k <= steps; ++k) {
            const pct = 1 - k / steps;
            const angleRad = Math.PI + pct * Math.PI * 0.5;
            const offX = dimensions + Math.cos(angleRad) * pipeBorder;
            const offY = dimensions + Math.sin(angleRad) * pipeBorder;

            context.lineTo(offX, offY);
        }

        context.lineTo(dimensions - pipeBorder, dimensions + 10);

        context.closePath();
        context.fill();
        context.stroke();
        // direction animation TODO

        /** @type {HTMLCanvasElement} */
        const flippedCanvas = createCanvas(dimensions, dimensions);
        const flippedContext = flippedCanvas.getContext("2d");
        flippedContext.quality = "best";
        flippedContext.clearRect(0, 0, dimensions, dimensions);
        flippedContext.scale(-1, 1);
        flippedContext.drawImage(canvas, -dimensions, 0, dimensions, dimensions);

        const outRight = fs.createWriteStream(path.join(outputFolder, "right_" + i + ".png"));
        const streamRight = canvas.createPNGStream();
        streamRight.pipe(outRight);

        const outLeft = fs.createWriteStream(path.join(outputFolder, "left_" + i + ".png"));
        const streamLeft = flippedCanvas.createPNGStream();
        streamLeft.pipe(outLeft);

        promises.push(new Promise(resolve => streamRight.on("end", resolve)));
        promises.push(new Promise(resolve => streamLeft.on("end", resolve)));
    }

    console.log("Waiting for completion");
    await Promise.all(promises);

    // Also wait a bit more
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Copying files to all locations");

    // Copy other files
    fs.copyFileSync(
        path.join(outputFolder, "forward_0.png"),
        path.join(__dirname, "..", "buildings", "pipe_top.png")
    );

    fs.copyFileSync(
        path.join(outputFolder, "right_0.png"),
        path.join(__dirname, "..", "buildings", "pipe_right.png")
    );

    fs.copyFileSync(
        path.join(outputFolder, "left_0.png"),
        path.join(__dirname, "..", "buildings", "pipe_left.png")
    );

    console.log("Done!");
}

run();