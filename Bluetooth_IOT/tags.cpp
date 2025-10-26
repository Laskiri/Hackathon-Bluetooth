#include <BLEDevice.h>      // Main BLE library
#include <BLEServer.h>      // Library to create a server
#include <BLEAdvertising.h> // Library to handle advertising
#include <Arduino.h>

// Random UUIDS
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

void startBLEAdvertising()
{
    Serial.println("Starting BLE advertising");

    // Create BLE Server
    BLEServer *pServer = BLEDevice::createServer();

    // Create BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create BLE Characteristic
    BLECharacteristic *pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);

    // Set an initial value (was missing in your version)
    pCharacteristic->setValue("Hello World");

    // Start the service
    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();

    // Configure and start advertising
    pAdvertising->addServiceUUID(SERVICE_UUID); // Add the service UUID to the advertisement
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
    pAdvertising->setMinPreferred(0x12);

    pServer->startAdvertising(); // This is the function that starts the broadcast

    Serial.println("ESP32 is now advertising as 'TAG'");
}

void setup()
{
    Serial.begin(115200);
    Serial.println("Booting up");

    BLEDevice::init("TAG");

    Serial.print("ESP32 MAC Address: ");
    Serial.println(BLEDevice::getAddress().toString().c_str());

    startBLEAdvertising();
}

void loop()
{
    delay(2000);
}