# ESP32-CAM & Supabase Integration Guide for WashFlow

This guide explains how the ESP32-CAM hardware captures vehicle photos, classifies vehicles into one of the 4 supported classes, posts data to Supabase, and displays the information in real time on the **Live Wash Floor** of the dashboard.

---

## 1. The 4 Vehicle Classes
The YOLO vehicle detection model (`models/best.pt`) classifies incoming vehicles into exactly **4 classes**:

| # | Class Name | Dashboard Badge Color | Lucide Icon | Description |
|---|------------|-----------------------|-------------|-------------|
| 1 | **Car** | Blue (`#2563eb`) | `<Car />` | Saloon cars, sedans, station wagons |
| 2 | **Truck** | Amber / Orange (`#d97706`) | `<Truck />` | Pickups, light commercial trucks, lorries |
| 3 | **Bus** | Purple (`#9333ea`) | `<Bus />` | Mini-buses, matatus, transit vans |
| 4 | **Motorcycle** | Emerald / Green (`#059669`) | `<Bike />` | Motorcycles, boda bodas |

---

## 2. Supabase Database Schema

Run the provided SQL script (`supabase_schema.sql`) in your **Supabase Project -> SQL Editor**:

```sql
-- 1. Create table for Vehicle Detections
CREATE TABLE IF NOT EXISTS public.vehicle_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 4 Classes: car, truck, bus, motorcycle
    vehicle_class TEXT NOT NULL CHECK (
        LOWER(vehicle_class) IN ('car', 'truck', 'bus', 'motorcycle')
    ),
    
    image_url TEXT,
    confidence NUMERIC DEFAULT 0.0,
    bay_number TEXT DEFAULT 'BAY 01',
    status TEXT DEFAULT 'Washing',
    service TEXT DEFAULT 'Exterior wash',
    camera_id TEXT DEFAULT 'esp32cam-01',
    plate_number TEXT
);

-- 2. Enable Realtime
ALTER TABLE public.vehicle_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.vehicle_detections FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access" ON public.vehicle_detections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.vehicle_detections FOR UPDATE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_detections;

-- 3. Storage Bucket for Captured Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-captures', 'vehicle-captures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public image access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'vehicle-captures');
CREATE POLICY "Allow ESP32-CAM upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'vehicle-captures');
```

---

## 3. How ESP32-CAM Posts Data to Supabase

### Option A: Direct HTTP POST from ESP32-CAM to Supabase REST API
The ESP32-CAM can send a standard HTTP POST request to the Supabase REST endpoint:

- **URL:** `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/rest/v1/vehicle_detections`
- **Method:** `POST`
- **Headers:**
  - `apikey: <YOUR_SUPABASE_ANON_KEY>`
  - `Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>`
  - `Content-Type: application/json`
  - `Prefer: return=representation`
- **JSON Body:**
```json
{
  "vehicle_class": "car",
  "image_url": "https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/storage/v1/object/public/vehicle-captures/capture_1001.jpg",
  "confidence": 97.4,
  "bay_number": "BAY 01",
  "status": "Washing",
  "service": "Exterior foam wash",
  "camera_id": "esp32cam-01"
}
```

### Option B: Upload Image via FastAPI Backend
If you prefer running YOLO inference on the server before posting to Supabase:
1. ESP32-CAM captures JPEG photo.
2. ESP32-CAM sends photo to FastAPI: `POST http://<SERVER_IP>:8000/predict?bay_number=BAY 01`
3. FastAPI runs YOLO model `models/best.pt`, detects `car`, `truck`, `bus`, or `motorcycle`, and posts the record into Supabase.

---

## 4. Arduino ESP32-CAM Sample Code Snippet

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* supabaseUrl = "https://hoiavaugfpyjbshtnuzp.supabase.co/rest/v1/vehicle_detections";
const char* supabaseAnonKey = "sb_publishable_EPF1_KUJ_rM6wYLRKhKF1Q_FmHLAdGa";

void postDetection(const char* vehicleClass, const char* imageUrl, float confidence, const char* bayNumber) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabaseUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseAnonKey);
    http.addHeader("Authorization", String("Bearer ") + supabaseAnonKey);
    http.addHeader("Prefer", "return=representation");

    String jsonPayload = "{";
    jsonPayload += "\"vehicle_class\":\"" + String(vehicleClass) + "\",";
    jsonPayload += "\"image_url\":\"" + String(imageUrl) + "\",";
    jsonPayload += "\"confidence\":" + String(confidence, 1) + ",";
    jsonPayload += "\"bay_number\":\"" + String(bayNumber) + "\",";
    jsonPayload += "\"status\":\"Washing\",";
    jsonPayload += "\"service\":\"Exterior wash\",";
    jsonPayload += "\"camera_id\":\"esp32cam-01\"";
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("Supabase Response Code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
}
```

---

## 5. Dashboard Real-Time Display Behavior
- **Real-Time Subscription:** The frontend subscribes to `vehicle_detections` through `supabase.channel('esp32_vehicle_detections')`.
- Whenever a new detection is inserted or updated in Supabase:
  1. The assigned bay card updates instantly with the **captured image**.
  2. Instead of the license plate number, the **Vehicle Class badge** (`Car`, `Truck`, `Bus`, `Motorcycle`) is displayed with its distinct color and icon.
  3. The confidence score (e.g. `98%`) and camera tag overlay are visible on the image.
  4. Clicking on the image opens a high-resolution preview modal with full details.
  5. The event also appears in **Live Arrivals** and **Camera-Based Vehicle Monitoring**.
