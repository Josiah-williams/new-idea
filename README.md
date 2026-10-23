# TaskPulse — Modern Task Flow

A modern, responsive To-Do and Task Management web application built purely with **Vanilla HTML, CSS, and JavaScript**.

---

## ✨ Features

- **Intuitive Task Management**:
  - Add tasks with title, priority (Low, Medium, High), category, and due date.
  - Inline task editing with instant update.
  - Interactive completion toggling with animated strikethrough.
  - Smooth slide-out removal animations on delete.
- **Progress Tracking**:
  - Live progress counter and completion percentage.
  - Responsive visual progress bar and SVG circular completion gauge.
- **Smart Filtering & Search**:
  - Filter by status: **All**, **Active**, and **Completed**.
  - Filter by category: **Work**, **Personal**, **Study**, **Fitness**, and **General**.
  - Real-time instant search across task title, priority, and category.
- **Audio Feedback (Web Audio API)**:
  - Synthesized audio tones (chimes on completion, pops on creation).
  - Sound effects toggle with persistent mute state.
- **Local Persistence**:
  - Saves all task data, preferences, and completion states to `localStorage`.

---

## 🛠️ Architecture & Constraints

- **No CSS Frameworks**: Built without Tailwind CSS or external CSS utility libraries.
- **No CSS Variables**: Uses direct, consistent color tokens and typography styles throughout `style.css`.
- **Pure JavaScript**: No external frontend dependencies or frameworks; relies on standard DOM manipulation and modern Web APIs.
- **Semantic HTML5**: Fully accessible with ARIA attributes and unique IDs.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Open directly or serve locally:
start index.html
```
