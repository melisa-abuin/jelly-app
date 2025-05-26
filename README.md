## Jelly Music App (JMA)

A lightweight & elegant music interface for Jellyfin. Made to be intuitive and minimal with great attention to detail, a clutter-free web app centered on music playback. Using the Jellyfin API, it provides seamless access to your personal music library. [Demo](https://stannnnn.github.io/jelly-app/login?demo=1)
<br/>

<div>
  <img src="public/light-variant.webp" alt="Light variant" width="49%">
  <img src="public/dark-variant.webp" alt="Dark variant" width="49%">
</div>
<br/>

<details>
  <summary>Additional screenshots</summary>
  <br/>
  <b>Sidenav search</b>
  <p>Search for tracks, artists, albums, playlists, genres</p>
  <img src="public/search-light-variant.png" alt="Sidenav search light variant" width="49%">
  <img src="public/search-dark-variant.png" alt="Sidenav search dark variant" width="49%">
  <br/>
  <br/>
  <b>Search results</b>
  <p>View additional search results in a dedicated window</p>
  <img src="public/search-results-light-variant.webp" alt="Search results light variant" width="49%">
  <img src="public/search-results-dark-variant.webp" alt="Search results dark variant" width="49%">
  <br/>
  <br/>
  <b>Artists</b>
  <p>Features most played songs, albums, and other collaborations</p>
  <img src="public/artist-light-variant.webp" alt="Artist light variant" width="49%">
  <img src="public/artist-dark-variant.webp" alt="Artist dark variant" width="49%">
  <br/>
  <br/>
  <b>Playlists</b>
  <p>Playlist view, with it's own numbered tracklist</p>
  <img src="public/playlist-light-variant.webp" alt="Playlist light variant" width="49%">
  <img src="public/playlist-dark-variant.webp" alt="Playlist dark variant" width="49%">
</details>

### Key Features

-   **Lightweight and Elegant Interface:** A minimal and intuitive design focused on a seamless music playback experience.
-   **Jellyfin Integration:** Connects to your Jellyfin server to access your personal music library.
-   **Comprehensive Search:** Easily find tracks, artists, albums, playlists, and genres with a quick sidenav search and a dedicated results page.
-   **Detailed Views:**
    -   **Artist Page:** Shows most played songs, albums, and collaborations.
    -   **Playlist Page:** Displays playlists with a numbered tracklist.
-   **Theme Support:** Switch between light and dark modes to suit your preference.
-   **Modern Tech Stack:** Built with React, Vite, and TypeScript for a fast and reliable experience.
-   **Client-Side Routing:** Smooth navigation powered by React Router.
-   **Efficient Data Fetching:** Utilizes Tanstack Query (React Query) for optimized data handling and caching.
-   **Progressive Web App (PWA):** Installable for an app-like experience.

### Installation

Jelly Music App is available as a production build, ready to deploy on an existing web server. Download the latest release from our project's [GitHub release page](https://github.com/Stannnnn/jelly-app/releases) and place the contents of the `dist` folder in a web-accessible directory.
<br/>
<br/>

[Yarn](https://classic.yarnpkg.com/lang/en/docs/install) (`npm i -g yarn`) is required if you wish to build the project or to run the development server on your own accord.

#### Build from Source

1. Clone the repository:
    ```bash
    git clone https://github.com/Stannnnn/jelly-app.git
    ```
2. Install dependencies:
    ```bash
    yarn
    ```
3. Build the production files:
    ```bash
    yarn build
    ```
4. Deploy the contents of the `dist` folder to a web-accessible directory.
   <br/>

Alternatively, you can run the production server directly: `yarn dev` or `yarn dev:nocache`
