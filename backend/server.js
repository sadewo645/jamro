/*
 * File: server.js
 * Description: Express server with WebSocket broadcasting simulated palm oil mill sensor data.
 */

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { generateSensorData, flattenSensors } from "./sensorSimulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, "../config.json");
const PORT = process.env.PORT || 4000;

/**
 * Loads the configuration file containing alert thresholds for each sensor.
 * @returns {object} Configuration mapping sensor names to threshold values.
 */
function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

const config = loadConfig();
const app = express();
app.use(cors());

/**
 * Serves the configuration values to the frontend so it can determine statuses.
 */
app.get("/api/config", (req, res) => {
  res.json(config);
});

/**
 * Serves a health check endpoint confirming that the backend is running.
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

/**
 * Broadcasts the latest sensor payload to all connected WebSocket clients.
 * @param {object} payload - Sensor readings to send.
 */
function broadcast(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

/**
 * Sends the most recent sensor values to a newly connected client.
 * @param {import("ws").WebSocket} ws - The client connection.
 */
function sendInitial(ws) {
  const snapshot = generateSensorData();
  ws.send(JSON.stringify(snapshot));
}

wss.on("connection", (ws) => {
  sendInitial(ws);
});

let latestPayload = generateSensorData();

/**
 * Produces and distributes fresh sensor readings on a fixed interval.
 */
setInterval(() => {
  latestPayload = generateSensorData();
  broadcast(latestPayload);
}, 3000);

/**
 * Exposes the flattened values for other services that prefer REST access.
 */
app.get("/api/sensors", (req, res) => {
  res.json(flattenSensors(latestPayload));
});

server.listen(PORT, () => {
  console.log(`Sensor server listening on port ${PORT}`);
});
