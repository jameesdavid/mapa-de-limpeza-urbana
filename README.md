# Urban Cleanliness Map

A web application that allows residents to report and visualize the cleanliness level of urban areas through an interactive map.

![App Screenshot](assets/screenshot.png)

## About

Urban Cleanliness Map is a collaborative platform where citizens can rate the cleanliness of their neighborhoods on a scale from 0 to 10. The ratings are displayed on an interactive map using color-coded overlays, making it easy to identify areas that need attention.

This project was developed as part of a university extension program, aiming to promote civic engagement and provide data-driven insights for urban management.

## Features

- Interactive map with geolocation support
- Google account authentication
- Rating system from 0 to 10
- Color-coded visualization of average cleanliness ratings
- 1km diameter coverage per rating
- Real-time data persistence with Firebase

## Tech Stack

- **Frontend:** Angular 20, TypeScript, SCSS
- **Maps:** Leaflet.js with OpenStreetMap
- **Backend:** Firebase (Firestore, Authentication)

## Getting Started

### Prerequisites

- Node.js 24+
- npm
- Firebase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment example file
cp src/environments/environment.example.ts src/environments/environment.ts

# Edit with your Firebase credentials
nano src/environments/environment.ts

# Start development server
ng serve
```

Open `http://localhost:4200` in your browser.

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database**
3. Enable **Authentication** with Google provider
4. Copy your credentials to `src/environments/environment.ts`

> **Note:** The `environment.ts` file is in `.gitignore` to protect your credentials.

## Color Scale

| Rating | Color | Classification |
|--------|-------|----------------|
| 8-10 | Green | Excellent |
| 6-8 | Light Green | Good |
| 4-6 | Yellow | Regular |
| 2-4 | Orange | Poor |
| 0-2 | Red | Very Poor |

## Project Structure

```
src/app/
├── components/
│   ├── header/          # App header with auth
│   ├── map/             # Interactive map
│   └── rating-modal/    # Rating submission modal
├── models/              # TypeScript interfaces
├── services/            # Firebase services
└── app.ts               # Root component
```

## Build

```bash
ng build
```

## License

This project was developed as part of the Extension Project V for the Analysis and Systems Development course.
