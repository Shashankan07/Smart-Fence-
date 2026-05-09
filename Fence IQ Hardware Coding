#include <WiFi.h>
#include <Webserver>
const char* ssid = "***************";
const char* password = "************";
#define PIR_PIN        4
#define LIMIT_POLE     14
#define LIMIT_BOX      27
#define MQ2_DO         26
#define RAIN_DO        25
#define RELAY_PIN      33
#define CT_PIN         34
#define LDR_PIN        35
#define RAIN_AO        32
#define MQ2_AO         39   // VN
#define SOIL_PIN       36   // VP
WebServer server(80);
int readStableADC(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  return sum / 10;
}
void handleData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  int ctValue    = readStableADC(CT_PIN);
  int ldrValue   = readStableADC(LDR_PIN);
  int rainValue  = readStableADC(RAIN_AO);
  int mq2Value   = readStableADC(MQ2_AO);
  int soilValue  = readStableADC(SOIL_PIN);
  String json = "{";
  json += "\"pir\":\"" + String(digitalRead(PIR_PIN) ? "MOTION" : "CLEAR") + "\",";
  json += "\"limit_pole\":\"" + String(digitalRead(LIMIT_POLE) ? "TAMPER" : "NORMAL") + "\",";
  json += "\"limit_box\":\"" + String(digitalRead(LIMIT_BOX) ? "OPEN" : "CLOSED") + "\",";
  json += "\"smoke_do\":\"" + String(digitalRead(MQ2_DO) ? "DETECTED" : "SAFE") + "\",";
  json += "\"rain_do\":\"" + String(digitalRead(RAIN_DO) ? "RAIN" : "NO_RAIN") + "\",";
  json += "\"ct_current\":" + String(ctValue) + ",";
  json += "\"light\":" + String(ldrValue) + ",";
  json += "\"rain_level\":" + String(rainValue) + ",";
  json += "\"smoke_level\":" + String(mq2Value) + ",";
  json += "\"soil\":" + String(soilValue) + ",";
  json += "\"relay\":\"" + String(digitalRead(RELAY_PIN) ? "ON" : "OFF") + "\"";
  json += "}";
  server.send(200, "application/json", json);
}
void relayOn() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  digitalWrite(RELAY_PIN, HIGH);
  server.send(200, "text/plain", "Fence ON");
}
void relayOff() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "Fence OFF");
}
void setup() {
  Serial.begin(115200);
  // Digital pins
  pinMode(PIR_PIN, INPUT);
  pinMode(LIMIT_POLE, INPUT_PULLUP);
  pinMode(LIMIT_BOX, INPUT_PULLUP);
  pinMode(MQ2_DO, INPUT);
  pinMode(RAIN_DO, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

 

