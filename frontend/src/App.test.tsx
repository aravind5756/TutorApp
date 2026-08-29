import { render, screen } from "@testing-library/react";

import App from "./App";


test("renders the tutor dashboard summary and today's lessons", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /good morning, aravind/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("Lessons this week")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /today’s lessons/i })).toBeInTheDocument();
  expect(screen.getAllByText("Maya Thompson")).not.toHaveLength(0);
});
