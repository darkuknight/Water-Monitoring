import { RequestHandler } from "express";

// In-memory simulated sensor state for smoother values
let state = {
  ph: 7.2,
  turbidity: 2.1,
  temperature: 26.5,
};

function nudge(value: number, step: number, min: number, max: number) {
  const delta = (Math.random() - 0.5) * step * 2;
  let next = value + delta;
  if (next < min) next = min + Math.random() * step;
  if (next > max) next = max - Math.random() * step;
  return Number(next.toFixed(2));
}

export const handleSensors: RequestHandler = async (_req, res) => {
  // TODO: Integrate with ThingsBoard REST API if device and keys are configured.
  // The app is also embedding the public dashboard URL on the frontend for visual parity.
  state = {
    ph: nudge(state.ph, 0.1, 6.0, 9.0),
    turbidity: nudge(state.turbidity, 0.4, 0, 10),
    temperature: nudge(state.temperature, 0.5, 10, 45),
  };

  res.json({
    timestamp: Date.now(),
    data: {
      ph: state.ph,
      turbidity: state.turbidity,
      temperature: state.temperature,
    },
  });
};
