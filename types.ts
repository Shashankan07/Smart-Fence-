export type SensorState = 'ACTIVE' | 'INACTIVE' | null;

export interface IoTData {
  // System Status
  online: boolean;
  uptime: string | null;
  
  // Fence Control & Power (Relay + CT Sensor)
  fenceActive: boolean | null; // Relay State
  fenceCurrent: number | null; // CT Sensor (Amps)
  fenceVoltage: number | null; // Calculated Voltage (Volts)
  cameraFeedUrl: string | null; // ESP32-CAM URL

  // Security Sensors
  pir: SensorState;           // PIR Sensor
  vibration: SensorState;     // Vibration Sensor
  poleTamper: SensorState;    // Limit Switch - Fence Pole
  boxTamper: SensorState;     // Limit Switch - Power Box

  // Environment
  smoke: number | null;       // MQ-2 (Value or 0/1)
  airQuality: 'GOOD' | 'BAD' | null; // Derived from smoke level
  rain: number | null;        // Rain Drop Sensor
  soilMoisture: number | null;// Soil Moisture Sensor
  lightLevel: number | null;  // LDR (Light Dependent Resistor)
  temperature: number | null; // DHT11
  humidity: number | null;    // DHT11
  pressure: number | null;    // (Optional placeholder)

  // Analytics
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'alert' | 'error' }>;
  history: Array<{ 
    time: string; 
    temp: number; 
    hum: number; 
    soil: number;
    rain: number;
    smoke: number;
  }>;
}

export const INITIAL_STATE: IoTData = {
  online: false,
  uptime: null,
  fenceActive: null,
  fenceCurrent: null,
  fenceVoltage: null,
  cameraFeedUrl: null,
  pir: null,
  vibration: null,
  poleTamper: null,
  boxTamper: null,
  smoke: null,
  airQuality: null,
  rain: null,
  soilMoisture: null,
  lightLevel: null,
  temperature: null,
  humidity: null,
  pressure: null,
  logs: [],
  history: []
};