# Modbus Monitoring System

A full-stack application for monitoring Modbus devices in industrial automation, built with **NestJS** (backend) and **Next.js** (frontend).

## 🏗️ Architecture

```
┌─────────────────┐
│  Modbus Device  │
│  (PLC/Sensor)   │
└────────┬────────┘
         │ Modbus TCP/IP
         │
┌────────▼────────┐
│  NestJS Backend │
│   (Port 3001)   │
│  - Modbus API   │
│  - REST Endpoints│
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Next.js Frontend│
│   (Port 3000)   │
│  - React UI      │
│  - Real-time     │
└─────────────────┘
```

## 📁 Project Structure

```
modbus/
├── backend/          # NestJS backend application
│   ├── src/
│   │   ├── modbus/   # Modbus module (service, controller, DTOs)
│   │   └── ...
│   └── package.json
├── frontend/         # Next.js frontend application
│   ├── pages/
│   │   └── index.tsx # Main UI page
│   └── package.json
├── examples/         # Example calculations
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Access to a Modbus device (or use a simulator for testing)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure Environment:**
   
   Copy the example environment file:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` for local development:
   ```env
   NODE_ENV=local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   MODBUS_HOST=192.168.100.40
   MODBUS_PORT=502
   MODBUS_SLAVE_ID=1
   MODBUS_TYPE=TCP
   MODBUS_TIMEOUT=2000
   ```
   
   **Device Configuration:**
   - IP Address Range: `192.168.100.1` to `192.168.100.255`
   - Port: `502` (standard Modbus TCP port)
   - Slave ID Range: `1-255`
   - Timeout: `2000ms` (2 seconds)
   
   **Environment Modes:**
   - **Local:** `NODE_ENV=local` - Uses localhost URLs
   - **Production:** `NODE_ENV=prod` - Uses production domains (modbus.ducorr.com and ap-modbus.ducorr.com)

### Running the Application

**Option 1: Run both services together (recommended)**
```bash
npm run dev
```

**Option 2: Run services separately**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## 📚 What is Modbus?

Modbus is a communication protocol used in industrial automation to connect devices such as:
- PLCs (Programmable Logic Controllers)
- Sensors and actuators
- HMIs (Human Machine Interfaces)
- SCADA systems

### Modbus Register Types

| Register Type | Purpose | Typical Use |
|--------------|---------|-------------|
| **0xxxx** | Coils | Digital outputs (read/write) |
| **1xxxx** | Discrete Inputs | Digital inputs (read-only) |
| **3xxxx** | Input Registers | Analog inputs (read-only) |
| **4xxxx** | Holding Registers | Analog outputs or internal values (read/write) |

## 🔌 API Endpoints

### Read Modbus Registers
```
GET /modbus/read?type=holding&address=0&quantity=1
```

**Query Parameters:**
- `type`: `holding` | `input` | `coil` | `discrete` (default: `holding`)
- `address`: Start address (default: `0`)
- `quantity`: Number of registers/coils (default: `1`, max: `125`)

**Response:**
```json
{
  "success": true,
  "type": "holding",
  "values": [
    {
      "address": 0,
      "rawValue": 1234
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Write Holding Register
```
POST /modbus/write/register
Content-Type: application/json

{
  "address": 0,
  "value": 1234
}
```

### Write Coil
```
POST /modbus/write/coil
Content-Type: application/json

{
  "address": 0,
  "value": true
}
```

## 🧪 Testing Without Hardware

To test without actual Modbus hardware, you can use a Modbus simulator:

### Option 1: ModbusPal (Java-based)
- Download: https://sourceforge.net/projects/modbuspal/
- Set `MODBUS_HOST=localhost` in backend `.env`

### Option 2: pymodbus (Python)
```python
from pymodbus.server import StartTcpServer
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from pymodbus.datastore import ModbusSequentialDataBlock

store = ModbusSlaveContext(
    di=ModbusSequentialDataBlock(0, [17]*100),
    co=ModbusSequentialDataBlock(0, [17]*100),
    hr=ModbusSequentialDataBlock(0, [17]*100),
    ir=ModbusSequentialDataBlock(0, [17]*100)
)
context = ModbusServerContext(slaves=store, single=True)
StartTcpServer(context, address=("localhost", 502))
```

### Option 3: Node.js Modbus Simulator
```bash
npm install -g modbus-simulator
modbus-simulator --port 502
```

## 🧮 Calculating Values

Modbus registers store raw integer values. To convert to meaningful units, see `examples/calculations.ts` for common conversion methods:

- Temperature scaling
- 32-bit float conversion
- Signed integer conversion
- BCD decoding
- Bit extraction

You can integrate these calculations into the backend service based on your device specifications.

## 🛠️ Development

### Backend (NestJS)
```bash
cd backend
npm run dev        # Development mode with hot reload
npm run build      # Build for production
npm run start:prod # Run production build
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev        # Development mode
npm run build      # Build for production
npm run start      # Run production build
```

## 📦 Production Deployment

### Environment Configuration

The application supports two environments:

- **Local Development:** `NODE_ENV=local`
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:3001`

- **Production:** `NODE_ENV=prod`
  - Frontend: `https://modbus.ducorr.com`
  - Backend API: `https://ap-modbus.ducorr.com`

### Quick Deployment

1. **Build both applications:**
   ```bash
   npm run build
   ```

2. **Start production servers:**
   ```bash
   npm run start
   ```

3. **Or use Docker:**
   ```bash
   # For local development
   docker-compose up -d
   
   # For production, set NODE_ENV=prod in .env first
   ```

### Full Deployment Guide

For detailed VPS deployment instructions, see:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete step-by-step VPS deployment guide
- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - GitHub repository setup and version control

## 🔧 Troubleshooting

### Connection Errors
- Verify Modbus device IP address and port
- Check network connectivity
- Ensure Modbus device is powered on
- Check firewall settings

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check backend CORS configuration in `backend/src/main.ts`

### Timeout Errors
- Increase `MODBUS_TIMEOUT` in backend `.env`
- Verify slave ID matches device configuration
- Check if device supports requested register type

## 📖 Documentation

- [Backend README](./backend/README.md) - NestJS backend documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - VPS deployment guide
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub setup and version control
- [Modbus Protocol Specification](https://modbus.org/specs.php)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
