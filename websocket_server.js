const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

const DEBUG = process.env.DEBUG === 'true';

const options = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
};

const server = https.createServer(options);

server.listen(8080, '0.0.0.0', () => {
    console.log('HTTPS server running at https://0.0.0.0:8080');
});

const wss = new WebSocket.Server({ server });

let ffmpegProcess;

const startFFmpeg = () => {
    if (ffmpegProcess) {
        ffmpegProcess.kill();
    }

    ffmpegProcess = spawn('ffmpeg', [
        '-re',
        '-i', 'video_pipe',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-f', 'v4l2',
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'yuv420p',
        '/dev/video0'
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
        if (DEBUG) console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        if (DEBUG) console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        if (DEBUG) console.log(`FFmpeg process exited with code ${code}`);
        // Restart FFmpeg if it exits
        startFFmpeg();
    });
};

startFFmpeg();

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    let videoStream;

    const openVideoStream = () => {
        videoStream = fs.createWriteStream(path.join(__dirname, 'video_pipe'), { flags: 'a' });
        videoStream.on('error', (err) => {
            if (DEBUG) console.error('Video stream error:', err);
        });
        videoStream.on('close', () => {
            if (DEBUG) console.log('Video stream closed');
        });
    };

    openVideoStream();

    ws.on('message', (message) => {
        const receiveTime = Date.now();
        if (DEBUG) console.log('Received data at', receiveTime);
        if (videoStream.writable) {
            videoStream.write(message);
        } else {
            if (DEBUG) console.error('Video stream is not writable');
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (videoStream) {
            videoStream.end(() => {
                if (DEBUG) console.log('Video stream closed');
            });
        }
    });

    ws.on('error', (error) => {
        if (DEBUG) console.error('WebSocket error:', error);
        if (videoStream) {
            videoStream.end(() => {
                if (DEBUG) console.log('Video stream closed due to error');
            });
        }
    });
});

console.log('Secure WebSocket server is running on wss://0.0.0.0:8080');