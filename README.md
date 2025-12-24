# City-Gifs: A Browser-Based GIF Creator for NYC

[![City-Gifs Demo](./public/demo.gif)](https://city-gifs.ericsharma.xyz/)

An installable, open-source tool that captures real-time images from NYC's public cameras and transforms them into shareable GIFs, all within the browser.

## ✨ Key Features

*   **100% Browser-Based:** Runs entirely in your browser with no server-side processing.
*   **User-Controlled:** You control the capture process, and all data remains on your machine.
*   **Live Camera Feeds:** Select from hundreds of public NYC traffic cameras.
*   **Interactive Map:** Find cameras across the five boroughs.
*   **Instant GIF Creation:** Create and preview GIFs in seconds.
*   **PWA Ready:** Installable on desktop or mobile for a native-app experience.

## ⚙️ How It Works

City-Gifs operates on a local-first principle, using modern web technologies to perform all actions directly on the client-side.

1.  **Image Polling:** The application polls public image endpoints for NYC's camera network to capture a sequence of still frames.
2.  **In-Browser Transcoding:** It uses **`ffmpeg.wasm`**, a WebAssembly port of FFmpeg, to process the captured frames. The images are written to a virtual filesystem in the browser's memory, and FFmpeg commands are executed to transcode them into a GIF.
3.  **Cross-Origin Isolation:** To enable the `SharedArrayBuffer` required by `ffmpeg.wasm` for efficient multithreading, the application is served with specific `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.

## 🐳 Running with Docker

The easiest way to run City-Gifs is with Docker.

### Option 1: Use the Pre-built Image from Docker Hub

Pull the image and run the container:
```bash
docker pull blindjoe/city-gifs:latest
docker run -d -p 3000:80 blindjoe/city-gifs:latest
```
The application will be available at `http://localhost:3000`.

### Option 2: Use Docker Compose

The `docker-compose.yml` provides a simple way to manage the container.

1.  **Run the container:**
    ```bash
    docker-compose up -d
    ```

2.  **Environment Variables:**
    You can create a `.env` file in the project root to customize the port:
    ```
    # .env
    PORT=8080
    ```
    The application will then be available at `http://localhost:8080`.

## 🚀 Local Development

For development, you can run the Vite server locally.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/city-gifs.git
    cd city-gifs
    ```

2.  **Install dependencies (using `pnpm`):**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

## 🛠️ Core Technologies

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS, Shadcn UI
*   **GIF Creation:** `ffmpeg.wasm`
*   **Mapping:** Leaflet.js
*   **Containerization:** Docker, Nginx

## 🤝 Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## ❤️ Inspiration

This project was heavily inspired by `wttdotm`'s [traffic_cam_photobooth](https://github.com/wttdotm/traffic_cam_photobooth). He did the hard work of scraping and organizing all the NYC camera endpoints in a file called `allCameras.js`, which is used in this repository.