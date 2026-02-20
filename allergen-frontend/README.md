# Allergen Label Displayer

## 1. Setup Instructions

**Prerequisites:** Ensure you have Node.js installed on your machine.

**Running the Backend:**
1. Navigate to the `backend` directory.
2. Run `npm install` to install dependencies (`express`, `multer`, `xlsx`, `axios`, `cors`).
3. Run `node server.js`. The backend will start on `http://localhost:3001`.

**Running the Frontend:**
1. Navigate to the `allergen-frontend` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev`. The frontend will be accessible via your browser (usually `http://localhost:5173`).

**How to Use the Application:**
1. **Upload:** On the home screen, click "Choose File", select your `recipes.xlsx` file, and click "Upload".
2. **Validate:** A table will appear showing the extracted recipes and ingredients. Review them to ensure the spreadsheet was read correctly.
3. **Process:** Click "Approve & Check Allergens". The system will process each ingredient.
4. **Navigate:** Once processing is complete, use the left sidebar to click through different recipes. The main panel will update to show the specific ingredients, recognized allergens, unrecognized items, and warnings for that selection.

## 2. Solution Explanation

**Approach:**
- **File Upload & Parsing:** The React application utilizes `FormData` to send the `.xlsx` file to the Express server. The server uses `multer` to handle the file upload stream and `xlsx` (SheetJS) to convert the spreadsheet rows into structured JSON data.
- **Server Creation & API Integration:** The Express server acts as both a parser and an API proxy. Because calling external APIs directly from a browser often results in CORS blocks, the React app sends the ingredient strings to our Node server, which then securely forwards the request to the `task.cover360.co.in/api/allergens` endpoint and relays the response back.
- **State Management & UI Rendering:** React's `useState` manages the application's linear flow (Upload -> Validate -> View Results). Complex state parsing handles grouping identical allergens together using a JavaScript `Set` and generates user-friendly warning strings dynamically based on the API response.

**Potential Improvements:**
- **Optimization:** Implement caching (like Redis on the backend or simple memory caching) so if "Tomato Sauce" is checked in Recipe 1, we don't need to make a network request for it again in Recipe 2.
- **Scaling:** Move the file processing to a background worker queue (like BullMQ) if files contain thousands of recipes, utilizing WebSockets to notify the frontend when processing is complete.
- **UI Enhancements:** Add drag-and-drop file upload zones, loading skeleton screens during API resolution, and edit capabilities in the validation table so users can correct typos before the API calls are made.