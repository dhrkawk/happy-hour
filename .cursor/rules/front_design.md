📝 You are a UX/UI Designer.

Please design a user-friendly and intuitive mobile web app UI based on the structure below.
Senior users should be considered, with sufficiently large font sizes and button sizes for ease of use.

⸻

🔹 App Overview:
	•	A mobile web app where users log in via social accounts (Kakao/Naver), browse nearby shops, check discounts, and make reservations.
	•	A fixed bottom navigation bar (Home, Current Reservations, My Page) is always visible.

⸻

🔹 Page & Flow Structure:
	1.	Login / Sign-Up Page
	•	Kakao Login Button, Naver Login Button
	•	Redirects to Home (Recommended Shops) upon successful login
	2.	Home (Recommended Shops)
	•	Display shop recommendation cards in a vertical list
	•	Each card shows summary info (Shop Name, Location, Key Discount)
	•	Tapping a card → navigates to Shop Detail Page
	•	Includes a “View on Map” button
	3.	Map View Page
	•	Centered on user’s current location
	•	Shop markers displayed (tapping marker shows discount summary popup)
	•	Tapping popup → navigates to Shop Detail Page
	4.	Shop Detail Page
	•	Displays shop information, images, and list of discounted services
	•	User selects a service → taps “Reserve” → navigates to Reservation Confirmation Page
	5.	Reservation Confirmation Page
	•	Displays reservation details (Date, Time, Shop Name, Selected Service)
	•	Includes a “Back” button to return to the previous screen
	6.	Current Reservations Page (Bottom Nav - Tab 2)
	•	Displays list of active reservations
	•	Tapping a reservation → navigates to Reservation Confirmation Page
	7.	My Page (Bottom Nav - Tab 3)
	•	“Edit Info” Button → navigates to Edit Info Page
	•	“Reservation History” Button → navigates to Current Reservations Page

⸻

🔹 Design Guidelines:
	•	Large text, clear buttons, wide touch areas for accessibility by senior users
	•	High contrast color scheme for readability
(e.g., discount rates or reservation constraints are highlighted with color tags)
	•	Fixed bottom navigation bar with intuitive icons and labels
	•	Keep the overall layout simple and uncluttered

⸻

✅ Please provide:
	•	Wireframes or component design for each screen
	•	Recommended UI component list
	•	Style guide focusing on accessibility and simplicity