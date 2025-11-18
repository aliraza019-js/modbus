# Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

Run this command from the root directory to install all dependencies:

```bash
npm run install:all
```

This will install dependencies for:
- Root project (concurrently for running both services)
- Backend (NestJS)
- Frontend (Next.js)

### 2. Configure Backend

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following configuration:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Modbus Configuration
MODBUS_HOST=192.168.1.10
MODBUS_PORT=502
MODBUS_SLAVE_ID=1
MODBUS_TYPE=TCP
MODBUS_TIMEOUT=2000
```

**Important:** Update `MODBUS_HOST` with your actual Modbus device IP address.

### 3. Configure Frontend (Optional)

Create a `.env.local` file in the `frontend/` directory if you need to override the API URL:

```bash
cd frontend
touch .env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start the Application

**Option A: Run both services together (Recommended)**

From the root directory:

```bash
npm run dev
```

This will start:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

**Option B: Run services separately**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### 5. Access the Application

- Open your browser and navigate to: **http://localhost:3000**
- The frontend will automatically connect to the backend API
- Check backend health: **http://localhost:3001/health**

## Testing Without Hardware

If you don't have a Modbus device, you can use a simulator:

### Using pymodbus (Python)

1. Install pymodbus:
   ```bash
   pip install pymodbus
   ```

2. Create a simulator script (`modbus_simulator.py`):
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

3. Run the simulator:
   ```bash
   python modbus_simulator.py
   ```

4. Update `backend/.env`:
   ```env
   MODBUS_HOST=localhost
   MODBUS_PORT=502
   ```

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all dependencies are installed: `cd backend && npm install`
- Check `.env` file exists and has correct values

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check CORS settings in `backend/src/main.ts`
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL

### Modbus connection errors
- Verify Modbus device IP address is correct
- Check network connectivity to the device
- Ensure Modbus device is powered on
- Verify slave ID matches device configuration
- Check firewall settings

### Port already in use
- Change ports in configuration files
- Or stop the service using the port:
  ```bash
  # Find process using port 3000
  lsof -ti:3000 | xargs kill -9
  
  # Find process using port 3001
  lsof -ti:3001 | xargs kill -9
  ```

## Next Steps

1. **Customize value calculations**: Edit `backend/src/modbus/modbus.service.ts` to add custom calculations based on your device specifications
2. **Add authentication**: Implement JWT or session-based authentication
3. **Add database**: Store historical data using PostgreSQL, MongoDB, or InfluxDB
4. **Add charts**: Integrate Chart.js or Recharts for data visualization
5. **Add WebSocket**: Implement real-time updates using WebSockets instead of polling

## Production Deployment

See the main [README.md](./README.md) for production deployment instructions using Docker.

