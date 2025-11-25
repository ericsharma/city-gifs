# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

The styling system for this React/Vite webapp is Shad CN

City-Gifs is meant to be a browser only (no server) live new york city gif creator.
This is how it works:
allCameras.js has a list of NYC cameras and when you visit the `/image` for the camera endpoint you can a live snapshot of what the camera is recording. To get the most recent snapshot all you to is repoll the endpoint. We can combine that behavior with ffmpeg.wasm to create playable and exportable gifs of new york city. Simply input the polling time and duration and wait for the gif to appear on your browser.

## FFMPEG.WASM usage

https://ffmpegwasm.netlify.app/docs/getting-started/usage
