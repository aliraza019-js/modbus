# Modbus Backend (NestJS)

NestJS backend service for Modbus communication with industrial automation devices.

## Features

- ✅ Read Modbus Holding Registers (4xxxx)
- ✅ Read Modbus Input Registers (3xxxx)
- ✅ Read Coils (0xxxx)
- ✅ Read Discrete Inputs (1xxxx)
- ✅ Write Holding Registers
- ✅ Write Coils
- ✅ RESTful API
- ✅ Input validation with DTOs
- ✅ CORS enabled for frontend
- ✅ Environment-based configuration

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Modbus Configuration
# IP Range: 192.168.100.1 to 192.168.100.255
# Port: 5000 (device default)
# Slave ID Range: 1-255
MODBUS_HOST=192.168.100.40
MODBUS_PORT=5000
MODBUS_SLAVE_ID=1
MODBUS_TYPE=TCP
MODBUS_TIMEOUT=3000
```

## Running the app

```bash
# development
npm run dev

# production mode
npm run build
npm run start:prod
```

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Read Modbus Registers
```
GET /modbus/read?type=holding&address=0&quantity=1
```

**Query Parameters:**
- `type` (optional): `holding` | `input` | `coil` | `discrete` (default: `holding`)
- `address` (optional): Start address (default: `0`)
- `quantity` (optional): Number of registers/coils to read (default: `1`, max: `125`)

**Example Response:**
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

## Project Structure

```
backend/
├── src/
│   ├── modbus/
│   │   ├── dto/
│   │   │   └── read-modbus.dto.ts
│   │   ├── modbus.controller.ts
│   │   ├── modbus.service.ts
│   │   └── modbus.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## License

MIT

